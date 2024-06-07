import axios from "axios";

const validKeyWord = (word, keysWords) => {
    return keysWords.some((keyWord) => word.includes(keyWord));
  }

const searchPhone = async (phone) => {
    try {
        const allUsers = await axios.get("http://localhost:4000/users");
        const user = allUsers.data.find(x => x.phone === phone);
        return user;
    } catch (error) {
        return null;
    }
};

const registerUser = async (user) => {
    try {
      await axios.post("http://localhost:4000/users", {
        name: user.name,
        phone: user.phone,
        email: user.email
      });
    } catch (error) {
      console.error("Error al registrar el usuario:", error);
    }
  }

export {validKeyWord, searchPhone, registerUser}