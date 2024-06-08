import axios from "axios";

const validKeyWord = (word, keysWords) => {
  return keysWords.some((keyWord) => word.includes(keyWord));
};

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

const validateEmail = async (email) => {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\.,;:\s@"]+\.)+[^<>()[\]\.,;:\s@"]{2,})$/i;
  return re.test(String(email).toLowerCase());
}
export { validKeyWord, searchPhone, registerUser, validateEmail };
