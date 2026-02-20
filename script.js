document.addEventListener("DOMContentLoaded", () => {
  // ===== VARIABLES GLOBALES =====
  let draggedItem = null
  let currentColumn = null
  let isDarkMode = localStorage.getItem("darkMode") === "true"

  // ===== ELEMENTOS DEL DOM =====
  // Contadores
  const todoCount = document.getElementById("todo-count")
  const progressCount = document.getElementById("progress-count")
  const doneCount = document.getElementById("done-count")
  const currentBoardName = document.getElementById("current-board-name")

  // Modales
  const taskModal = document.getElementById("task-modal")
  const boardModal = document.getElementById("board-modal")
  const boardsListModal = document.getElementById("boards-list-modal")

  // Formularios
  const modalTitle = document.getElementById("modal-title")
  const taskTitleInput = document.getElementById("task-title")
  const taskDescriptionInput = document.getElementById("task-description")
  const taskPrioritySelect = document.getElementById("task-priority")
  const taskDateInput = document.getElementById("task-date")
  const taskTagsInput = document.getElementById("task-tags")
  const taskStatusSelect = document.getElementById("task-status")
  const taskIdInput = document.getElementById("task-id")
  const boardNameInput = document.getElementById("board-name")

  // Botones
  const saveTaskBtn = document.getElementById("save-task-btn")
  const cancelTaskBtn = document.getElementById("cancel-task-btn")
  const saveBoardBtn = document.getElementById("save-board-btn")
  const cancelBoardBtn = document.getElementById("cancel-board-btn")
  const newBoardBtn = document.getElementById("new-board-btn")
  const resetBtn = document.getElementById("reset-btn")
  const boardsBtn = document.getElementById("boards-btn")
  const newBoardModalBtn = document.getElementById("new-board-modal-btn")
  const closeBoardsBtn = document.getElementById("close-boards-btn")
  const searchInput = document.getElementById("search-input")
  const filterBtns = document.querySelectorAll(".filter-btn")
  const themeToggleBtn = document.getElementById("theme-toggle")
  const boardList = document.getElementById("board-list")

  // Columnas y tarjetas
  const columns = document.querySelectorAll(".kanban-column")
  const addTaskBtns = document.querySelectorAll(".add-task-btn")

  // ===== GESTIÓN DE DATOS =====
  // Estructura de datos para tableros
  let boards = {}
  let currentBoardId = ""

  // Cargar datos desde localStorage
  function loadFromLocalStorage() {
    try {
      // Intentar cargar los tableros
      const storedBoards = localStorage.getItem("kanban-boards")
      if (storedBoards) {
        boards = JSON.parse(storedBoards)
        console.log("Tableros cargados:", boards)
      } else {
        // Si no hay tableros, crear uno por defecto
        boards = {
          default: {
            id: "default",
            name: "Tablero principal",
            tasks: [],
          },
        }
        saveToLocalStorage()
      }

      // Cargar el tablero actual
      currentBoardId = localStorage.getItem("currentBoardId") || "default"
      if (!boards[currentBoardId]) {
        currentBoardId = "default"
      }

      // Actualizar la interfaz
      updateBoardName()
      renderTasks()
    } catch (error) {
      console.error("Error al cargar datos:", error)
      alert("Hubo un error al cargar los datos. Se iniciará con un tablero vacío.")

      // Reiniciar con un tablero por defecto
      boards = {
        default: {
          id: "default",
          name: "Tablero principal",
          tasks: [],
        },
      }
      currentBoardId = "default"
      saveToLocalStorage()
    }
  }

  // Guardar datos en localStorage
  function saveToLocalStorage() {
    try {
      localStorage.setItem("kanban-boards", JSON.stringify(boards))
      localStorage.setItem("currentBoardId", currentBoardId)
      console.log("Datos guardados correctamente")
    } catch (error) {
      console.error("Error al guardar datos:", error)
      alert("No se pudieron guardar los cambios. Verifica el espacio disponible en tu navegador.")
    }
  }

  // Actualizar nombre del tablero en la interfaz
  function updateBoardName() {
    if (boards[currentBoardId]) {
      currentBoardName.textContent = boards[currentBoardId].name
    }
  }

  // ===== RENDERIZADO DE TAREAS =====
  // Renderizar todas las tareas del tablero actual
  function renderTasks() {
    // Limpiar todas las columnas
    document.querySelector(".todo-cards").innerHTML = ""
    document.querySelector(".progress-cards").innerHTML = ""
    document.querySelector(".done-cards").innerHTML = ""

    if (!boards[currentBoardId]) {
      console.error("El tablero actual no existe:", currentBoardId)
      return
    }

    // Obtener tareas del tablero actual
    const tasks = boards[currentBoardId].tasks || []

    // Renderizar cada tarea en su columna correspondiente
    tasks.forEach((task) => {
      const card = createTaskCard(task)
      const column = document.querySelector(`.${task.status}-cards`)
      if (column) {
        column.appendChild(card)
      }
    })

    // Actualizar contadores
    updateCounters()
  }

  // Función para crear una nueva tarjeta
  function createTaskCard(task) {
    const { id, title, description, priority, date, tags, status } = task

    // Crear elemento de tarjeta
    const card = document.createElement("div")
    card.className =
      "kanban-card p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all animate-fade-in"
    card.setAttribute("draggable", "true")
    card.setAttribute("data-task-id", id)
    card.setAttribute("data-priority", priority)

    // Determinar color de prioridad
    let priorityColor, priorityText
    switch (priority) {
      case "high":
        priorityColor = "bg-red-100 text-red-800"
        priorityText = "Alta"
        break
      case "medium":
        priorityColor = "bg-yellow-100 text-yellow-800"
        priorityText = "Media"
        break
      case "low":
        priorityColor = "bg-green-100 text-green-800"
        priorityText = "Baja"
        break
    }

    // Crear etiquetas HTML
    let tagsHTML = ""
    if (tags && tags.length > 0) {
      const tagColors = [
        "bg-blue-100 text-blue-800",
        "bg-purple-100 text-purple-800",
        "bg-pink-100 text-pink-800",
        "bg-indigo-100 text-indigo-800",
        "bg-green-100 text-green-800",
        "bg-orange-100 text-orange-800",
        "bg-red-100 text-red-800",
        "bg-gray-100 text-gray-800",
      ]

      tagsHTML = tags
        .map((tag, index) => {
          const colorClass = tagColors[index % tagColors.length]
          return `<span class="${colorClass} text-xs font-medium px-2 py-0.5 rounded">${tag}</span>`
        })
        .join("")
    }

    // Crear HTML interno de la tarjeta
    card.innerHTML = `
      <div class="absolute right-2 top-2 flex space-x-1">
        <span class="priority-badge ${priorityColor} text-xs font-medium px-2 py-0.5 rounded">${priorityText}</span>
      </div>
      <div class="mt-4">
        <h3 class="font-medium text-gray-800 mb-1">${title}</h3>
        <p class="text-sm text-gray-500">${description}</p>
        <div class="flex flex-wrap gap-1 mt-2">
          ${tagsHTML}
        </div>
        <div class="flex items-center justify-between mt-3 text-xs text-gray-500">
          <div class="flex items-center">
            <i class="far fa-calendar-alt mr-1"></i>
            <span>${date || "Sin fecha"}</span>
          </div>
          <div class="flex space-x-2">
            <button class="text-gray-400 hover:text-blue-500 edit-task">
              <i class="fas fa-edit"></i>
            </button>
            <button class="text-gray-400 hover:text-red-500 delete-task">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `

    // Agregar eventos a la tarjeta
    card.addEventListener("dragstart", handleDragStart)
    card.addEventListener("dragend", handleDragEnd)

    // Agregar eventos a los botones
    const editBtn = card.querySelector(".edit-task")
    const deleteBtn = card.querySelector(".delete-task")

    editBtn.addEventListener("click", () => editTask(card))
    deleteBtn.addEventListener("click", () => deleteTask(card))

    return card
  }

  // Actualizar contadores de tareas
  function updateCounters() {
    todoCount.textContent = document.querySelector(".todo-cards").children.length
    progressCount.textContent = document.querySelector(".progress-cards").children.length
    doneCount.textContent = document.querySelector(".done-cards").children.length
  }

  // ===== GESTIÓN DE TAREAS =====
  // Editar una tarea existente
  function editTask(card) {
    const taskId = card.getAttribute("data-task-id")
    const title = card.querySelector("h3").textContent
    const description = card.querySelector("p").textContent
    const priority = card.getAttribute("data-priority")
    const dateText = card.querySelector(".flex.items-center span").textContent
    const status = card.closest(".kanban-column").getAttribute("data-status")

    // Obtener etiquetas
    const tagElements = card.querySelectorAll(".flex.flex-wrap.gap-1 span")
    const tags = Array.from(tagElements)
      .map((tag) => tag.textContent)
      .join(", ")

    // Llenar el formulario
    modalTitle.textContent = "Editar tarea"
    taskTitleInput.value = title
    taskDescriptionInput.value = description
    taskPrioritySelect.value = priority
    taskTagsInput.value = tags
    taskStatusSelect.value = status
    taskIdInput.value = taskId

    // Intentar convertir la fecha si es posible
    if (dateText !== "Sin fecha") {
      try {
        const dateObj = new Date(dateText)
        if (!isNaN(dateObj)) {
          const year = dateObj.getFullYear()
          const month = String(dateObj.getMonth() + 1).padStart(2, "0")
          const day = String(dateObj.getDate()).padStart(2, "0")
          taskDateInput.value = `${year}-${month}-${day}`
        }
      } catch (e) {
        taskDateInput.value = ""
      }
    }

    // Mostrar modal
    toggleTaskModal(true)
  }

  // Función para eliminar una tarea
  function deleteTask(card) {
    if (confirm("¿Estás seguro de eliminar esta tarea?")) {
      const taskId = card.getAttribute("data-task-id")

      // Eliminar de la interfaz
      card.classList.add("animate-fade-in")
      setTimeout(() => {
        card.remove()
        updateCounters()
      }, 300)

      // Eliminar del almacenamiento
      const tasks = boards[currentBoardId].tasks
      const taskIndex = tasks.findIndex((t) => t.id === taskId)
      if (taskIndex !== -1) {
        tasks.splice(taskIndex, 1)
        saveToLocalStorage()
      }
    }
  }

  // ===== EVENTOS DE ARRASTRE =====
  function handleDragStart() {
    draggedItem = this
    currentColumn = this.parentElement
    setTimeout(() => {
      this.classList.add("dragging")
    }, 0)
  }

  function handleDragEnd() {
    this.classList.remove("dragging")
    draggedItem = null
    currentColumn = null
  }

  function handleDragOver(e) {
    e.preventDefault()
    this.classList.add("drop-zone")
  }

  function handleDragLeave() {
    this.classList.remove("drop-zone")
  }

  function handleDrop(e) {
    e.preventDefault()
    this.classList.remove("drop-zone")

    if (draggedItem && this !== currentColumn) {
      const cardsContainer = this.querySelector(".kanban-column > div:nth-child(2)")
      cardsContainer.appendChild(draggedItem)

      // Actualizar el estado de la tarea
      const taskId = draggedItem.getAttribute("data-task-id")
      const newStatus = this.getAttribute("data-status")

      // Actualizar en el almacenamiento
      const tasks = boards[currentBoardId].tasks
      const task = tasks.find((t) => t.id === taskId)
      if (task) {
        task.status = newStatus
        saveToLocalStorage()
      }

      updateCounters()
    }
  }

  // ===== GESTIÓN DE MODALES =====
  // Modal de tareas
  function toggleTaskModal(show = true) {
    if (show) {
      taskModal.classList.remove("hidden")
      document.body.classList.add("overflow-hidden")
    } else {
      taskModal.classList.add("hidden")
      document.body.classList.remove("overflow-hidden")
      // Limpiar formulario
      taskTitleInput.value = ""
      taskDescriptionInput.value = ""
      taskPrioritySelect.value = "medium"
      taskDateInput.value = ""
      taskTagsInput.value = ""
      taskIdInput.value = ""
    }
  }

  // Función para mostrar/ocultar el modal de nuevo tablero
  function toggleBoardModal(show = true) {
    if (show) {
      boardModal.classList.remove("hidden")
      document.body.classList.add("overflow-hidden")
      boardNameInput.value = ""
    } else {
      boardModal.classList.add("hidden")
      document.body.classList.remove("overflow-hidden")
    }
  }

  // Modal de lista de tableros
  function toggleBoardsListModal(show = true) {
    if (show) {
      loadBoardsList()
      boardsListModal.classList.remove("hidden")
      document.body.classList.add("overflow-hidden")
    } else {
      boardsListModal.classList.add("hidden")
      document.body.classList.remove("overflow-hidden")
    }
  }

  // Cargar lista de tableros
  function loadBoardsList() {
    boardList.innerHTML = ""

    Object.values(boards).forEach((board) => {
      const li = document.createElement("li")
      li.className = `board-item p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center ${
        board.id === currentBoardId ? "active bg-blue-50" : ""
      }`
      li.setAttribute("data-board-id", board.id)

      li.innerHTML = `
        <span>${board.name}</span>
        <div class="flex space-x-2">
          <button class="text-gray-400 hover:text-blue-500 rename-board" data-board-id="${board.id}">
            <i class="fas fa-edit"></i>
          </button>
          ${
            board.id !== "default"
              ? `
            <button class="text-gray-400 hover:text-red-500 delete-board" data-board-id="${board.id}">
              <i class="fas fa-trash"></i>
            </button>
          `
              : ""
          }
        </div>
      `

      // Evento para seleccionar tablero
      li.addEventListener("click", function (e) {
        if (!e.target.closest("button")) {
          const boardId = this.getAttribute("data-board-id")
          switchBoard(boardId)
        }
      })

      // Eventos para los botones
      const renameBtn = li.querySelector(".rename-board")
      if (renameBtn) {
        renameBtn.addEventListener("click", function (e) {
          e.stopPropagation()
          const boardId = this.getAttribute("data-board-id")
          const board = boards[boardId]

          const newName = prompt("Nuevo nombre para el tablero:", board.name)
          if (newName && newName.trim()) {
            board.name = newName.trim()
            saveToLocalStorage()
            loadBoardsList()
            if (boardId === currentBoardId) {
              updateBoardName()
            }
          }
        })
      }

      const deleteBtn = li.querySelector(".delete-board")
      if (deleteBtn) {
        deleteBtn.addEventListener("click", function (e) {
          e.stopPropagation()
          const boardId = this.getAttribute("data-board-id")

          if (confirm(`¿Estás seguro de eliminar el tablero "${boards[boardId].name}"?`)) {
            delete boards[boardId]
            saveToLocalStorage()

            // Si se eliminó el tablero actual, cambiar al tablero por defecto
            if (boardId === currentBoardId) {
              switchBoard("default")
            }

            loadBoardsList()
          }
        })
      }

      boardList.appendChild(li)
    })
  }

  // Cambiar de tablero
  function switchBoard(boardId) {
    if (boards[boardId]) {
      currentBoardId = boardId
      localStorage.setItem("currentBoardId", boardId)
      updateBoardName()
      renderTasks()
      toggleBoardsListModal(false)
    }
  }

  // ===== EVENTOS DE BOTONES =====
  // Guardar tarea
  saveTaskBtn.addEventListener("click", () => {
    const title = taskTitleInput.value.trim()
    const description = taskDescriptionInput.value.trim()
    const priority = taskPrioritySelect.value
    const date = taskDateInput.value
    const tagsText = taskTagsInput.value.trim()
    const status = taskStatusSelect.value
    const taskId = taskIdInput.value || Date.now().toString()

    if (title) {
      // Formatear fecha
      let formattedDate = "Sin fecha"
      if (date) {
        const dateObj = new Date(date)
        formattedDate = dateObj.toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      }

      // Procesar etiquetas
      const tags = tagsText ? tagsText.split(",").map((tag) => tag.trim()) : []

      // Crear datos de la tarea
      const taskData = {
        id: taskId,
        title,
        description,
        priority,
        date: formattedDate,
        tags,
        status,
      }

      // Si es edición, eliminar la tarjeta anterior
      if (taskIdInput.value) {
        const existingCard = document.querySelector(`[data-task-id="${taskId}"]`)
        if (existingCard) {
          existingCard.remove()
        }

        // Actualizar en el almacenamiento
        const tasks = boards[currentBoardId].tasks
        const taskIndex = tasks.findIndex((t) => t.id === taskId)
        if (taskIndex !== -1) {
          tasks[taskIndex] = taskData
        }
      } else {
        // Agregar al almacenamiento
        boards[currentBoardId].tasks.push(taskData)
      }

      // Guardar en localStorage
      saveToLocalStorage()

      // Crear nueva tarjeta
      const newCard = createTaskCard(taskData)

      // Agregar a la columna correspondiente
      const targetColumn = document.querySelector(`.kanban-column[data-status="${status}"]`)
      const cardsContainer = targetColumn.querySelector(`.${status}-cards`)
      cardsContainer.appendChild(newCard)

      // Actualizar contadores
      updateCounters()

      // Cerrar modal
      toggleTaskModal(false)
    }
  })

  // Evento para cancelar tarea
  cancelTaskBtn.addEventListener("click", () => {
    toggleTaskModal(false)
  })

  // Cerrar modal de tarea al hacer clic fuera
  taskModal.addEventListener("click", function (e) {
    if (e.target === this) {
      toggleTaskModal(false)
    }
  })

  // Evento para mostrar tableros existentes
  boardsBtn.addEventListener("click", () => {
    toggleBoardsListModal(true)
  })

  // Evento para crear nuevo tablero
  newBoardBtn.addEventListener("click", () => {
    toggleBoardModal(true)
  })

  // Mostrar modal de nuevo tablero desde lista de tableros
  newBoardModalBtn.addEventListener("click", () => {
    toggleBoardsListModal(false)
    toggleBoardModal(true)
  })

  // Evento para guardar nuevo tablero
  saveBoardBtn.addEventListener("click", () => {
    const boardName = boardNameInput.value.trim()

    if (boardName) {
      const boardId = "board_" + Date.now()

      // Crear nuevo tablero
      boards[boardId] = {
        id: boardId,
        name: boardName,
        tasks: [],
      }

      // Guardar en localStorage
      saveToLocalStorage()

      // Cambiar al nuevo tablero
      switchBoard(boardId)

      // Cerrar modal
      toggleBoardModal(false)
    }
  })

  // Evento para cancelar nuevo tablero
  cancelBoardBtn.addEventListener("click", () => {
    toggleBoardModal(false)
  })

  // Cerrar modal de nuevo tablero al hacer clic fuera
  boardModal.addEventListener("click", function (e) {
    if (e.target === this) {
      toggleBoardModal(false)
    }
  })

  // Cerrar modal de lista de tableros
  closeBoardsBtn.addEventListener("click", () => {
    toggleBoardsListModal(false)
  })

  // Cerrar modal de lista de tableros al hacer clic fuera
  boardsListModal.addEventListener("click", function (e) {
    if (e.target === this) {
      toggleBoardsListModal(false)
    }
  })

  // Evento para reiniciar tablero
  resetBtn.addEventListener("click", () => {
    if (
      confirm(`¿Estás seguro de reiniciar el tablero "${boards[currentBoardId].name}"? Se eliminarán todas las tareas.`)
    ) {
      // Vaciar tareas
      boards[currentBoardId].tasks = []
      saveToLocalStorage()

      // Recargar tablero
      renderTasks()
    }
  })

  // Evento para mostrar/ocultar dropdown de exportar
  /*exportBtn.addEventListener("click", () => {
    exportDropdown.classList.toggle("hidden")
  })

  // Cerrar dropdown al hacer clic fuera
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#export-btn") && !e.target.closest("#export-dropdown")) {
      exportDropdown.classList.add("hidden")
    }
  })

  // Función para exportar a PDF
  function exportToPDF(selector, filename) {
    const element = document.querySelector(selector)

    // Crear un contenedor temporal para el contenido a exportar
    const tempContainer = document.createElement("div")
    tempContainer.className = "pdf-export-container"
    tempContainer.style.padding = "20px"
    tempContainer.style.backgroundColor = "white"
    tempContainer.style.color = "black"

    // Clonar el contenido
    const clone = element.cloneNode(true)

    // Eliminar botones y elementos interactivos del clon
    const buttonsToRemove = clone.querySelectorAll("button")
    buttonsToRemove.forEach((btn) => btn.remove())

    // Asegurarse de que las tarjetas sean visibles
    const cards = clone.querySelectorAll(".kanban-card")
    cards.forEach((card) => {
      card.style.display = "block"
      card.style.marginBottom = "10px"
      card.style.pageBreakInside = "avoid"
      card.removeAttribute("draggable")
    })

    // Agregar título
    const title = document.createElement("h1")
    title.textContent = filename.replace(".pdf", "")
    title.style.marginBottom = "20px"
    title.style.fontSize = "24px"
    title.style.fontWeight = "bold"
    title.style.textAlign = "center"

    tempContainer.appendChild(title)
    tempContainer.appendChild(clone)

    // Agregar temporalmente al DOM
    document.body.appendChild(tempContainer)

    // Configuración de html2pdf
    const opt = {
      margin: 10,
      filename: filename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    }

    // Generar PDF
    const opt2 = {
      margin: 1,
      filename: "myfile.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    }
    html2pdf()
      .set(opt2)
      .from(tempContainer)
      .save()
      .then(() => {
        // Eliminar el contenedor temporal
        document.body.removeChild(tempContainer)
      })
  }

  // Eventos para exportar
  exportAll.addEventListener("click", () => {
    exportToPDF("#kanban-board", `kanban-${boards[currentBoardId].name}.pdf`)
    exportDropdown.classList.add("hidden")
  })

  exportTodo.addEventListener("click", () => {
    exportToPDF(".kanban-column[data-status='todo']", `kanban-por-hacer-${boards[currentBoardId].name}.pdf`)
    exportDropdown.classList.add("hidden")
  })

  exportProgress.addEventListener("click", () => {
    exportToPDF(".kanban-column[data-status='progress']", `kanban-en-progreso-${boards[currentBoardId].name}.pdf`)
    exportDropdown.classList.add("hidden")
  })

  exportDone.addEventListener("click", () => {
    exportToPDF(".kanban-column[data-status='done']", `kanban-hecho-${boards[currentBoardId].name}.pdf`)
    exportDropdown.classList.add("hidden")
  })*/

  // Búsqueda de tareas
  searchInput.addEventListener("input", function () {
    const searchTerm = this.value.toLowerCase()
    const allCards = document.querySelectorAll(".kanban-card")

    allCards.forEach((card) => {
      const title = card.querySelector("h3").textContent.toLowerCase()
      const description = card.querySelector("p").textContent.toLowerCase()
      const tags = Array.from(card.querySelectorAll(".flex.flex-wrap.gap-1 span")).map((tag) =>
        tag.textContent.toLowerCase(),
      )

      const matchesSearch =
        title.includes(searchTerm) || description.includes(searchTerm) || tags.some((tag) => tag.includes(searchTerm))

      card.style.display = matchesSearch ? "" : "none"
    })
  })

  // Filtrado de tareas
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      // Actualizar botones activos
      filterBtns.forEach((b) => b.classList.remove("active", "bg-primary-100", "text-primary-800"))
      filterBtns.forEach((b) => b.classList.add("bg-gray-100", "text-gray-800"))
      this.classList.remove("bg-gray-100", "text-gray-800")
      this.classList.add("active", "bg-primary-100", "text-primary-800")

      const filter = this.getAttribute("data-filter")
      const allCards = document.querySelectorAll(".kanban-card")

      allCards.forEach((card) => {
        const priority = card.getAttribute("data-priority")
        const dateText = card.querySelector(".flex.items-center span").textContent.toLowerCase()
        const isToday = dateText.includes("hoy") || dateText.includes("today")

        if (filter === "all") {
          card.style.display = ""
        } else if (filter === "high" && priority === "high") {
          card.style.display = ""
        } else if (filter === "medium" && priority === "medium") {
          card.style.display = ""
        } else if (filter === "low" && priority === "low") {
          card.style.display = ""
        } else if (filter === "today" && isToday) {
          card.style.display = ""
        } else {
          card.style.display = "none"
        }
      })
    })
  })

  // Cambiar tema
  themeToggleBtn.addEventListener("click", function () {
    document.documentElement.classList.toggle("dark")
    isDarkMode = document.documentElement.classList.contains("dark")
    localStorage.setItem("darkMode", isDarkMode)

    // Cambiar icono
    const icon = this.querySelector("i")
    if (isDarkMode) {
      icon.classList.remove("fa-moon")
      icon.classList.add("fa-sun")
    } else {
      icon.classList.remove("fa-sun")
      icon.classList.add("fa-moon")
    }
  })

  // Actualizar icono del tema al cargar
  if (isDarkMode) {
    const icon = themeToggleBtn.querySelector("i")
    icon.classList.remove("fa-moon")
    icon.classList.add("fa-sun")
  }

  // Mostrar/ocultar sidebar en móvil
  /*sidebarToggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("hidden")
    sidebarBackdrop.classList.toggle("hidden")
  })

  sidebarBackdrop.addEventListener("click", () => {
    sidebar.classList.add("hidden")
    sidebarBackdrop.classList.add("hidden")
  })*/

  // ===== INICIALIZACIÓN =====
  // Aplicar modo oscuro si está guardado
  if (isDarkMode) {
    document.documentElement.classList.add("dark")
    const icon = themeToggleBtn.querySelector("i")
    icon.classList.remove("fa-moon")
    icon.classList.add("fa-sun")
  }

  // Aplicar eventos de arrastre a las columnas
  columns.forEach((column) => {
    column.addEventListener("dragover", handleDragOver)
    column.addEventListener("dragleave", handleDragLeave)
    column.addEventListener("drop", handleDrop)
  })

  // Eventos para añadir nuevas tareas
  addTaskBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const column = this.closest(".kanban-column")
      const status = column.getAttribute("data-status")

      // Resetear formulario
      modalTitle.textContent = "Añadir nueva tarea"
      taskTitleInput.value = ""
      taskDescriptionInput.value = ""
      taskPrioritySelect.value = "medium"
      taskDateInput.value = ""
      taskTagsInput.value = ""
      taskStatusSelect.value = status
      taskIdInput.value = ""

      // Mostrar modal
      toggleTaskModal(true)
    })
  })

  // Cargar datos al iniciar
  loadFromLocalStorage()
})

