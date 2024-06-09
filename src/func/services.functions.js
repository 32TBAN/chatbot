import axios from "axios";

const searchPhone = async (phone) => {
  try {
    const response = await axios.get("http://localhost:4000/users");
    const allUsers = response.data;
    const user = allUsers.find((x) => x.phone === phone);
    // Registro en consola para ver el resultado de la búsqueda
    console.log("Usuario encontrado:", user);
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

const existSchedule = async (schedule) => {
  try {
    const response = await axios.get("http://localhost:4000/schedule");
    const allSchedules = response.data;
    const schedule = allSchedules.find((x) => x.date === schedule.date);

    if (schedule) {
      const {hour, minute} = schedule.time.split(':')
      
    }
    return false;
  } catch (error) {
    console.log(error);
  }
};
export { searchPhone, registerUser, addSchedule, existSchedule };
