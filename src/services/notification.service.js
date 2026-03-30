import { EventEmitter } from 'node:events'

const ee = new EventEmitter()

ee.on('user:invited', (email) => console.log("Se ha invitado al usuario con email: " + email))

export default ee