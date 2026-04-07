const mongoose = require('mongoose');

const ContatoSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    telefone: { type: String, required: true },
    email: { type: String, required: true },

    melhor_horario: { type: String, enum: ['Manhã', 'Tarde', 'Nite'] },
    meio_contato_ideal: { type: String, enum: ['Email', 'WhatsApp', 'Ligação'] },
    tipo_negocio: { type: String, enum: ['Venda', 'Locação'] },

    mensagem: { type: String },

    data_visita: { type: String },
    hora_visita: { type: String },

    imovel_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Imovel', 
        required: true 
    }

}, { 
    timestamps: true
    });

module.exports = mongoose.model('Contato', ContatoSchema);