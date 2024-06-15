import axios, { all } from "axios";

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

const addSchedule = async (schedule, user) => {
  try {
    await axios.post("http://localhost:4000/schedule", {
      date: schedule.date,
      hour: schedule.time,
      description: schedule.subject,
      id_user: user.id,
    });
  } catch (error) {
    console.log(error);
  }
};

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

const projectByPhone = async (phone) => {
  try {
    const user = searchPhone(phone);
    const responde = await axios.get(
      `http://localhost:4000/project/${user.id}`
    );
    return responde.data;
  } catch (error) {
    console.log(error);
  }
};

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

const messageReports = async () => {
  const reportData = await generateReports();

  return `📊 Reportes:\n\n👥 Nuevos Clientes:\n${reportData.newClientsReport}\n\n📂 Cartera Reportada:\n${reportData.reportedPortfolioReport}\n\n💼 Cartera Cobrada:\n${reportData.collectedPortfolioReport}\n\nPuede ver más detalles aquí.`;
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
};
