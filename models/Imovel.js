const mongoose = require('mongoose');

const ImovelSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    preco: { type: Number, required: true },
    quartos: { type: Number, required: true },
    url_da_midia: { type: String, required: true },
    tipo_arquivo: { type: String }
    }, {
        timestamps: true
    });

module.exports = mongoose.model('Imovel', ImovelSchema);