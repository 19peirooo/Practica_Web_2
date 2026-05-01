
export default function deliveryNoteHandler(socket) {

    socket.on("deliverynote:new", (data) => {
      console.log("Nuevo Albarán:", data.description);
    });

    socket.on("deliverynote:signed", (data) => {
      console.log("Albarán firmado:", data.description);
    });

}