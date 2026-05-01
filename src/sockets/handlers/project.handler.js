
export default function projectHandler(socket) {

    socket.on("project:new", (data) => {
      console.log("Nuevo Proyecto:", data.name);
    });

}