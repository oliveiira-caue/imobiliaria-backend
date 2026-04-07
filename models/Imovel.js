const mongoose = require('mongoose');

const ImovelSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    descricao: { type: String, required: true },
    tipo_imovel: { 
        type: String, 
        enum: ['Apartamento', 'Casa', 'Sala Comercial', 'Terreno', 'Galpão'], 
        required: true 
    },
    finalidade: { type: String, enum: ['Venda', 'Locação'], required: true },
    destaque: { type: Boolean, default: false },
    status: { 
    type: String, 
    enum: ['Disponível', 'Vendido', 'Alugado'], 
    default: 'Disponível' 
    },

    mobiliado: { type: Boolean, default: false },
    tipo_finalidade: { type: String, enum: ['Residencial', 'Comercial'], required: true },
    em_condominio: { type: Boolean, default: false },

    preco: { type: Number, required: true },
    valor_condominio: { type: Number },
    iptu: { type: Number },

    area_util: { type: Number },
    quartos: { type: Number },
    suites: { type: Number },
    banheiros: { type: Number },
    vagas: { type: Number },

    endereco: { type: String, required: true },
    bairro: { type: String, required: true },
    cidade: { type: String, default: 'Belém' },
    estado: { type: String, default: 'PA' },
    latitude: { type: Number },
    longitude: { type: Number },

    comodidades_imovel: [{ type: String }],
    comodidades_condominio: [{ type: String }],

    visualizacoes: { type: Number, default: 0 },
    galeria: [{ type: String, required: true }] 
    
}, { 
    timestamps: true 
});

module.exports = mongoose.model('Imovel', ImovelSchema);