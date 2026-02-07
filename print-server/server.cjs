/**
 * Servidor de Impresión para Fluxo POS v6
 * Formato completo con dirección, teléfono y productos
 */

const http = require('http');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 3001;

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/print') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                printTicket(data, (err) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, error: err.message }));
                    } else {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true }));
                    }
                });
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false }));
            }
        });
        return;
    }

    res.writeHead(404);
    res.end('Not Found');
});

/**
 * Formato completo - 24 chars por linea
 */
function generateTicket(order) {
    const W = 24;
    const lines = [];

    const center = (t) => {
        const s = String(t).substring(0, W);
        const p = Math.floor((W - s.length) / 2);
        return ' '.repeat(Math.max(0, p)) + s;
    };

    const sep = '='.repeat(W);
    const dash = '-'.repeat(W);

    // Partir texto largo en lineas
    const wrap = (text) => {
        const result = [];
        let remaining = String(text);
        while (remaining.length > 0) {
            result.push(remaining.substring(0, W));
            remaining = remaining.substring(W);
        }
        return result;
    };

    // Header
    lines.push('');
    lines.push(center(order.companyName || 'FLUXO'));
    const fecha = new Date().toLocaleDateString();
    const hora = new Date().toLocaleTimeString().substring(0, 5);
    lines.push(center(fecha + ' - ' + hora));
    lines.push(sep);

    // Ticket
    lines.push('TICKET: #' + order.ticket_number);
    lines.push(dash);

    // Tipo y pago en recuadro simple
    let tipo = 'LOCAL';
    if (order.order_type === 'delivery') {
        tipo = 'DELIVERY';
    } else if (order.order_type === 'takeaway') {
        tipo = 'TAKE AWAY';
    } else if (order.order_type === 'local' || order.table) {
        tipo = 'MESA';
    }
    const pago = (order.payment_type || 'EFECTIVO').toUpperCase();
    lines.push('[' + tipo + '] [' + pago + ']');
    lines.push(sep);

    // Si es pedido de mesa, mostrar nombre de la mesa
    if (order.order_type === 'local' && order.table) {
        lines.push('MESA:');
        lines.push((order.table.name || 'Mesa ' + order.table.id).toUpperCase());
        lines.push(dash);
    }

    // Cliente y dirección
    lines.push('CLIENTE / DIRECCION:');
    const cliente = order.client?.name || 'Mostrador';
    lines.push(cliente.toUpperCase());

    // Dirección (del delivery o del cliente)
    const direccion = order.delivery_address || order.client?.address;
    if (direccion) {
        lines.push(...wrap(direccion));
    }

    // Teléfono
    const telefono = order.delivery_phone || order.client?.phone;
    if (telefono) {
        lines.push('TELEFONO:');
        lines.push(telefono);
    }

    lines.push(sep);

    // Productos
    lines.push('');
    (order.order_items || []).forEach(item => {
        // Nombre completo del producto
        const name = (item.item_name || item.product?.name || 'Item').toUpperCase();
        const qty = item.quantity || 1;

        // Si el nombre es largo, dividirlo
        const productLine = qty + ' x ' + name;
        lines.push(...wrap(productLine));

        // Notas/gustos
        if (item.notes) {
            lines.push('  (' + item.notes + ')');
        }
    });

    lines.push('');
    lines.push(sep);

    // Total: siempre visible en todos los tickets
    if (order.total) {
        lines.push('');
        lines.push('TOTAL: $' + Number(order.total).toLocaleString('es-AR'));
        lines.push('');
        lines.push(sep);
    }

    // Observaciones con recuadro
    lines.push('OBSERVACIONES:');
    lines.push('+' + '-'.repeat(W - 2) + '+');
    lines.push('|' + ' '.repeat(W - 2) + '|');
    lines.push('|' + ' '.repeat(W - 2) + '|');
    lines.push('|' + ' '.repeat(W - 2) + '|');
    lines.push('+' + '-'.repeat(W - 2) + '+');
    lines.push(dash);

    // Footer
    lines.push('');
    lines.push(center('*** FIN DE ORDEN ***'));
    lines.push('');
    lines.push('');
    lines.push('');

    return lines.join('\r\n');
}

function printTicket(order, callback) {
    const content = generateTicket(order);
    const tempFile = path.join(__dirname, 'ticket.txt');

    fs.writeFile(tempFile, content, 'utf8', (err) => {
        if (err) return callback(err);

        exec(`notepad /p "${tempFile}"`, (error) => {
            setTimeout(() => fs.unlink(tempFile, () => { }), 2000);
            console.log('Ticket #' + order.ticket_number + ' OK');
            callback(null);
        });
    });
}

server.listen(PORT, () => {
    console.log('================================');
    console.log('  FLUXO PRINT v6 - Completo');
    console.log('  Puerto: ' + PORT);
    console.log('  Listo!');
    console.log('================================');
});
