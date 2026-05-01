
export default function clientHandler(socket) {

    socket.on("client:new", (data) => {
      console.log("Nuevo Cliente:", data.name);
    });

}