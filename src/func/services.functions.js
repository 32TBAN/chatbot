import axios from "axios";

/**
 * Busca un usuario por su número de teléfono.
 * @param {string} phone - El número de teléfono a buscar.
 * @returns {Object|null} - El usuario encontrado o null si no se encuentra.
 */
const searchPhone = async (phone) => {
  try {
    const response = await axios.get("http://localhost:4000/users");
    const allUsers = response.data;
    const user = allUsers.find((x) => x.phone === phone);
    return user || null;
  } catch (error) {
    console.error("Error al buscar el teléfono:", error);
    return null;
  }
};

/**
 * Registra un nuevo usuario.
 * @param {Object} user - Los datos del usuario a registrar.
 * @param {string} user.name - El nombre del usuario.
 * @param {string} user.phone - El número de teléfono del usuario.
 * @param {string} user.email - El correo electrónico del usuario.
 */
const registerUser = async (user) => {
  try {
    await axios.post("http://localhost:4000/user", {
      name: user.name,
      phone: user.phone,
      email: user.email,
    });
  } catch (error) {
    console.error("Error al registrar el usuario:", error);
  }
};

/**
 * Añade un nuevo horario para un usuario.
 * @param {Object} schedule - Los datos del horario.
 * @param {string} schedule.date - La fecha del horario.
 * @param {string} schedule.time - La hora del horario.
 * @param {string} schedule.subject - La descripción del horario.
 * @param {Object} user - Los datos del usuario.
 * @param {string} user.id - El ID del usuario.
 */
const addSchedule = async (schedule, user) => {
  try {
    return (
      await axios.post("http://localhost:4000/schedule", {
        date: schedule.date,
        hour: schedule.time,
        description: schedule.subject,
        id_user: user.id,
      })
    ).data;
  } catch (error) {
    console.log(error);
  }
};

/**
 * Verifica si existe un conflicto de horario con una nueva cita.
 * @param {Object} newSchedule - Los datos de la nueva cita.
 * @param {string} newSchedule.date - La fecha de la nueva cita.
 * @param {string} newSchedule.time - La hora de la nueva cita.
 * @returns {boolean} - True si hay un conflicto, false si no.
 */
const existSchedule = async (newSchedule) => {
  try {
    const response = await axios.get("http://localhost:4000/schedules");
    const allSchedules = response.data;
    if (allSchedules == []) {
      return false;
    }
    // Verificar si la nueva cita está dentro de las horas laborables permitidas
    const [newHour, newMinute] = newSchedule.time.split(":").map(Number);
    if (
      newHour < 8 ||
      (newHour >= 12 && newHour < 14) ||
      newHour >= 18 ||
      (newHour === 12 && newMinute > 0) ||
      (newHour === 18 && newMinute > 0)
    ) {
      console.log("está fuera del horario laborable");
      return true; // Indica que la hora de la cita está fuera del horario laborable
    }

    // Verificar si la nueva cita se solapa con alguna cita existente
    for (const schedule of allSchedules) {
      if (schedule.date === newSchedule.date) {
        const [existingHour, existingMinute] = schedule.hour
          .split(":")
          .map(Number);

        // Verificar si la nueva cita se solapa con la cita existente
        if (
          (newHour === existingHour && newMinute === existingMinute) || // Mismo inicio
          (newHour === existingHour + 1 && newMinute < existingMinute) || // Nueva cita termina antes de la existente
          (newHour + 1 === existingHour && newMinute > existingMinute) // Nueva cita comienza antes de que termine la existente
        ) {
          console.log("hay un conflicto de horario");
          return true; // Indica que hay un conflicto de horario
        }
      }
    }

    return false; // Indica que no hay conflictos de horario
  } catch (error) {
    console.log(error);
    return true; // Asumir conflicto si hay un error en la solicitud
  }
};

/**
 * Añade un comentario para un usuario.
 * @param {Object} comment - Los datos del comentario.
 * @param {string} comment.content - El contenido del comentario.
 * @param {string} comment.id_user - El ID del usuario.
 */
const addComment = async (comment) => {
  try {
    await axios.post("http://localhost:4000/comment", {
      content: comment.content,
      id_user: comment.id_user,
    });
  } catch (error) {
    console.log(error);
  }
};

/**
 * Obtiene los proyectos asociados a un número de teléfono.
 * @param {string} phone - El número de teléfono del usuario.
 * @returns {Object[]} - Los proyectos asociados al usuario.
 */
const projectByPhone = async (phone) => {
  try {
    const user = await searchPhone(phone);
    const responde = await axios.get(
      `http://localhost:4000/project/${user.id}`
    );
    return responde.data;
  } catch (error) {
    console.log(error);
  }
};

/**
 * Obtiene los pagos asociados a un proyecto.
 * @param {string} id_project - El ID del proyecto.
 * @returns {Object[]} - Los pagos asociados al proyecto.
 */
const paymentByProyect = async (id_project) => {
  try {
    const responde = await axios.get(
      `http://localhost:4000/payment/${id_project}`
    );
    return responde.data;
  } catch (error) {
    console.log(error);
  }
};

/**
 * Genera informes de nuevos clientes, cartera reportada y cartera cobrada.
 * @returns {Object} - Los informes generados.
 */
const generateReports = async () => {
  try {
    const response1 = await axios.get("http://localhost:4000/getNewClients");
    const response2 = await axios.get("http://localhost:4000/getPortfolio");
    const response3 = await axios.get(
      "http://localhost:4000/getCollectedPortfolio"
    );

    const newClients = response1.data;
    const reportedPortfolio = response2.data;
    const collectedPortfolio = response3.data;

    const newClientsReport = newClients
      .map((client) => `- ${client.name} (${client.email})`)
      .join("\n");
    const reportedPortfolioReport = reportedPortfolio
      .map((project) => `- ${project.name} (Estado: ${project.status})`)
      .join("\n");
    const collectedPortfolioReport = collectedPortfolio
      .map((project) => `- ${project.name} (Estado: ${project.status})`)
      .join("\n");

    return {
      newClientsReport,
      reportedPortfolioReport,
      collectedPortfolioReport,
    };
  } catch (error) {
    console.error("Error generando reportes:", error);
    throw error;
  }
};

/**
 * Genera un mensaje con los informes.
 * @returns {string} - El mensaje con los informes.
 */
const messageReports = async () => {
  const reportData = await generateReports();

  return `📊 Reportes:\n\n👥 Nuevos Clientes:\n${reportData.newClientsReport}\n\n📂 Cartera Reportada:\n${reportData.reportedPortfolioReport}\n\n💼 Cartera Cobrada:\n${reportData.collectedPortfolioReport}\n\nPuede ver más detalles aquí:`;
};
/**
 * Obtiene los recordatorios de pagos pendientes.
 * @returns {Object[]} - Los recordatorios de pagos pendientes.
 */
async function getReminders() {
  try {
    const response = await axios.get("http://localhost:3000/api/reminders");
    const playments = response.data;

    
    if (!Array.isArray(playments)) {
      console.warn("playments no es un array, inicializando vacío");
      return [];
    }

    return playments;
  } catch (err) {
    console.error("Error al obtener recordatorios:", err.message);
    return [];
  }
}


/**
 * Busca un usuario por su ID.
 * @param {string} id_user - El ID del usuario.
 * @returns {Object} - Los datos del usuario.
 */
const searchUserById = async (id_user) => {
  const response = await axios.get(`http://localhost:4000/userId/${id_user}`);
  return response.data;
};
/**
 * anade un proyecto segun la cita agendada solo prueba
 * @param {schedule} datos de la cita
 * @returns {user} - Los datos del usuario.
 */
const addProject = async (schedule, user) => {
  try {
    const status = [
      "Planificación",
      "Diseño",
      "Implementación",
      "Pruebas",
      "Despliegue",
      "Mantenimiento",
    ];
    const randomIndex = Math.floor(Math.random() * status.length);
    const randomStatus = status[randomIndex];

    const project = (
      await axios.post(`http://localhost:4000/project`, {
        name: schedule.description,
        deliverDate: schedule.date,
        status: randomStatus,
        idSchedule: schedule.id,
      })
    ).data;

    const status2 = ["Pendiente", "Pagado"];
    const randomIndex2 = Math.floor(Math.random() * status2.length);
    const randomStatus2 = status2[randomIndex2];

    const amounr = [
      500, 600, 700, 800, 900, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000,
    ];
    const randomIndex3 = Math.floor(Math.random() * amounr.length);
    const randomStatus3 = amounr[randomIndex3];

    console.log(
      await axios.post(`http://localhost:4000/payment`, {
        amount: randomStatus3,
        dueDate: schedule.date,
        status: randomStatus2,
        idUser: user.id,
        idProject: project.id,
      })
    );
  } catch (error) {
    console.log(error);
  }
};

export {
  searchPhone,
  registerUser,
  addSchedule,
  existSchedule,
  addComment,
  projectByPhone,
  generateReports,
  paymentByProyect,
  messageReports,
  getReminders,
  searchUserById,
  addProject,
};
