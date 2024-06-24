const messages = {
  greeting:
    "😊 Aquí están algunas de las opciones que ofrecemos: \n\n" +
    "1. ✅ Información sobre nuestros productos\n" +
    "2. 🔎 Consultas de sobre los productos\n" +
    "3. 🗓️ Agendar una cita para una propuesta personalizada para tu proyecto.\n" +
    "4. 📝 Comentarios o sugerencias\n\n" +
    "Responde con el número de la opción que deseas o una palabra clave.",
  information:
    "📢 *Somos una empresa de desarrollo de software*, aquí están algunos de nuestros productos: \n\n",
  product1:
    "📱 *Aplicación móvil Salud Total*: Puedes encontrarla en el siguiente enlace:\n[🔗 Salud Total](https://play.google.com/store/apps/details?id=com.saludtotal.saludtotaleps&hl=es_EC&pli=1)\n\n",
  product2:
    "💻 *Aplicación web SunnyLand*: Puedes encontrarla en el siguiente enlace:\n[🔗 Aplicación web](https://ansimuz.itch.io/sunny-land-pixel-game-art)\n\n",
  product3:
    "🛡️ *Assets para juegos Fantasy Knight*: Puedes encontrarla en el siguiente enlace:\n[🔗 Fantasy Knight](https://aamatniekss.itch.io/fantasy-knight-free-pixelart-animated-character)\n",
  product4:
    "🗡️ *Aplicación web Tiny Swords*: Puedes encontrarla en el siguiente enlace:\n[🔗 Tiny Swords](https://pixelfrog-assets.itch.io/tiny-swords)\n\n",
  product5:
    "🌲 *Aplicación web Mystic Woods*: Puedes encontrarla en el siguiente enlace:\n[🔗 Mystic Woods](https://game-endeavor.itch.io/mystic-woods)\n\n",
  support:
    "Tenemos varias áreas de consulta para elegir. ¿Cuál de estos servicios te gustaría explorar?\n\n" +
    " a. 🚧 Problemas de instalación\n" +
    " b. 🔄 Actualizaciones y parches\n" +
    " c. 💵 Precios\n" +
    " d. ⌛ Promociones\n" +
    " e. 📊 Estado de sus proyectos\n" +
    "Responde con la letra de la opción que deseas.",
  install:
    "¡Entiendo que estás experimentando problemas de instalación! Para ayudarte, te enviaré un archivo PDF con las instrucciones detalladas de instalación de nuestros productos. Por favor, espera un momento mientras lo preparo para ti. ⚙️📄",
  updates:
    "Te invito a visitar nuestro sitio web donde podrás encontrar información detallada sobre las últimas actualizaciones y parches disponibles para nuestros productos. 🌐🛠️\n[https://wwebjs.dev/guide/creating-your-bot/#run-your-bot]",
  documentsGuide:
    "Puedes encontrar nuestra documentación y guías en: 📚🔍\n[https://wwebjs.dev/guide/creating-your-bot/#run-your-bot]",
  promotionMessage:
    "🚀 ¡Descubre cómo nuestra empresa de desarrollo de software puede ayudarte a alcanzar tus objetivos! 🚀 \n\n" +
    "Somos expertos en ofrecer soluciones innovadoras y personalizadas para empresas de todos los tamaños. Ya sea que necesites desarrollar una aplicación móvil, un sitio web, o implementar soluciones empresariales, estamos aquí para ayudarte. \n\n" +
    "💡 Con nosotros, obtendrás: \n" +
    "- Desarrollo de software de alta calidad.\n" +
    "- Soporte técnico dedicado.\n" +
    "- Soluciones personalizadas según tus necesidades.\n" +
    "- Entrega a tiempo y dentro del presupuesto.\n\n" +
    "¡No te pierdas la oportunidad de llevar tu empresa al siguiente nivel con nuestra ayuda! ¿Listo para comenzar?",
  email: "📧 Por favor, ingresa tu email:",
  register: "¡Registro completado! 🎉",
  numberNotFound:
    "No encontramos tu número en nuestra base de datos. ¿Deseas registrarte? (responde 'sí' o 'no')",
  name: "✏️ Por favor, ingresa tu nombre:",
  noRegister: "👌 Entendido. Si cambias de opinión, no dudes en decirmelo.",
  invalidEmail: "El email no es válido. Por favor, ingresa un email válido: 📧",
  schedule: "📍 Todas las citas agendadas se llevarán a cabo en:",
  scheduleConfirmed:
    "🤔 Aun así quiere agendar una cita? (responde 'si' o 'no')",
  formatDate:
    "📅 Por favor, ingresa la fecha de la cita (en formato AAAA-MM-DD):",
  noSchedule: "👌 Entendido. Si cambias de opinión, no dudes en decirmelo.",
  formatHour: "⏰ Por favor, ingresa la hora de la cita (en formato HH:MM):",
  invalidDate:
    "❌ Fecha inválida. Por favor, ingresa la fecha en el formato correcto (AAAA-MM-DD):",
  invalidHour:
    "❌ Hora inválida. Por favor, ingresa la hora en el formato correcto (HH:MM):",
  subjectAppointment: "📝 Por favor, ingresa el asunto de la cita:",
  succesfullAppointment: "✅ Se ha agendado su cita el día:",
  addAppointment: "📅 Si gusta, puede agregar este evento a su calendario.",
  existSchedule:
    "⚠️ Esa hora y fecha ya están ocupadas o no son laborables (HORAS LABORABLES DE 8:00-12:00 Y 14:00-18:00). ¿Quiere escoger otra fecha o hora? (si/no)",
  comments:
    "💬 Sus comentarios o sugerencias son de mucha ayuda para nosotros. Por favor escríbalos a continuación:",
  thankYouForComment:
    "🙏 Gracias por su comentario, lo tomaremos en cuenta para seguir mejorando 😊",
  paymentReminder:
    "🔔 Recordatorio de Pago: Estimado cliente, su pago de [monto] vence el [fecha]. Por favor, asegúrese de realizar su pago a tiempo para evitar recargos. Gracias por su atención.",
  overduePayment:
    "⚠️ Aviso de Pago Atrasado: Estimado cliente, notamos que su pago de [monto] con vencimiento el [fecha] aún no ha sido recibido. Le pedimos que realice el pago lo antes posible para evitar interrupciones en el servicio. Si ya realizó el pago, por favor ignore este mensaje.",
  discountOffer:
    "🎉 Oferta Especial: Obtén un 10% de descuento en tu próxima compra con el código ''Gatitos''. Esta oferta es válida hasta el 24 de junio de 2024. ¡No te lo pierdas!",
  pricingMessage:
    "💵 Los precios dependerán de las necesidades específicas del software para tu negocio. Aquí tienes algunos precios indicativos para tu guía: \n\n" +
    "- Página web estática: $500 - $5,000\n" +
    "- Página web dinámica: $5,000 - $15,000\n" +
    "- Aplicación móvil: $10,000 - $50,000\n" +
    "- Aplicación web: $15,000 - $50,000\n\n" +
    "Estos precios son aproximados y pueden variar según los requerimientos específicos de tu proyecto. Te invitamos a agendar una cita para una propuesta personalizada.",
  promo1:
    "🌟 ¡Oferta de Verano! 🌟 Obtén un 20% de descuento en el desarrollo de tu nueva página web. Esta oferta es válida hasta el 31 de julio de 2024. ¡No te pierdas esta oportunidad! Contáctanos para más detalles.",
  promo2:
    "🚀 ¡Lanzamiento Especial! 🚀 Desarrolla tu aplicación móvil con nosotros y recibe un 15% de descuento. Oferta válida para los primeros 10 clientes. ¡Aprovecha y lleva tu negocio al siguiente nivel!",
  promo3:
    "🎉 ¡Descuento por Tiempo Limitado! 🎉 Contrata el desarrollo de una aplicación web antes del 30 de junio de 2024 y obtén un 10% de descuento. ¡No dejes pasar esta oferta especial!",
  promo4:
    "💼 ¡Promoción para Nuevos Clientes! 💼 Regístrate con nosotros y recibe un 25% de descuento en tu primer proyecto de desarrollo de software. Oferta válida hasta el 31 de agosto de 2024.",
  promo5:
    "🎁 ¡Oferta de Fin de Año! 🎁 Planifica tu proyecto de desarrollo de software con nosotros antes del 31 de diciembre de 2024 y recibe un 20% de descuento. ¡Comienza el nuevo año con las herramientas adecuadas para el éxito!",
    noProject: "No tiene ningun proyecto todavía 🚫"
};
export default messages;
