import { buffer } from "stream/consumers"
import PDFDocument from "pdfkit"

export async function generatePdf(data) {

    const user = data.user
    const company = data.company
    const client = data.client
    const project = data.project
    
    var doc = new PDFDocument()

    const pdfPromise = buffer(doc)
    
    doc.fontSize(20).text(`Albaran ${data._id}`, {align: 'center'})
    doc.moveDown()

    doc.fontSize(12)
    doc.text(`Usuario: ${user.fullName}`)
    doc.text(`Email: ${user.email}`)
    doc.moveDown()

    doc.text(`Empresa: ${company.name}`)
    doc.text(`CIF: ${company.cif}`)
    doc.moveDown()

    doc.text(`Cliente: ${client.name}`)
    doc.text(`CIF: ${client.cif}`)
    doc.moveDown()

    doc.text(`Proyecto: ${project.name}`)
    doc.text(`Código: ${project.projectCode}`)
    doc.moveDown()

    doc.text(`Fecha: ${data.workDate}`)
    doc.text(`Descripción: ${data.description}`)
    doc.text(`Tipo: ${data.format}`)
    doc.moveDown()

    if (data.format === 'hours') {

        doc.text(`Horas: ${data.hours}`)

        doc.text(`Trabajadores: `)
        data.workers.forEach(worker => {
            doc.text(`- ${worker.name}: ${worker.hours} horas`)
        });

    } else {
      doc.text(`Material: ${data.material}`)
      doc.text(`Cantidad: ${data.quantity} ${data.unit}`)
    }
    doc.moveDown()

    doc.fontSize(16).text('Firma:', {align: 'center'})

    doc.end()

    const pdfBuffer = await pdfPromise
    return pdfBuffer

}

export async function generateSignedPdf(data, signature) {
    
    const user = data.user
    const company = data.company
    const client = data.client
    const project = data.project
    
    var doc = new PDFDocument()

    const pdfPromise = buffer(doc)
    
    doc.fontSize(20).text(`Albaran ${data._id}}`, {align: 'center'})
    doc.moveDown()

    doc.fontSize(12)
    doc.text(`Usuario: ${user.fullName}`)
    doc.text(`Email: ${user.email}`)
    doc.moveDown()

    doc.text(`Empresa: ${company.name}`)
    doc.text(`CIF: ${company.cif}`)
    doc.moveDown()

    doc.text(`Cliente: ${client.name}`)
    doc.text(`CIF: ${client.cif}`)
    doc.moveDown()

    doc.text(`Proyecto: ${project.name}`)
    doc.text(`Código: ${project.projectCode}`)
    doc.moveDown()

    doc.text(`Fecha: ${data.workDate}`)
    doc.text(`Descripción: ${data.description}`)
    doc.text(`Tipo: ${data.format}`)
    doc.moveDown()

    if (data.format === 'hours') {

        doc.text(`Horas: ${data.hours}`)

        doc.text(`Trabajadores: `)
        data.workers.forEach(worker => {
            doc.text(`- ${worker.name}: ${worker.hours} horas`)
        });

    } else {
      doc.text(`Material: ${data.material}`)
      doc.text(`Cantidad: ${data.quantity} ${data.unit}`)
    }
    doc.moveDown()

    doc.fontSize(16).text('Firma:', {align: 'center'})

    doc.end()

    const pdfBuffer = await pdfPromise
    return pdfBuffer

}
