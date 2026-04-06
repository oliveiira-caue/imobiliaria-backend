const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const upload = require('./config/cloudinary');
const Imovel = require('./models/Imovel');

const app = express();

app.use(cors());
app.use(express.json());


mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Banco de Dados conectado!'))
    .catch((erro) => console.error('Erro no banco:', erro));

app.get('/', (req, res) => {
    res.json({'message': 'API da imobiliaria funcionando!'});
});


app.post('/imoveis', upload.single('midia'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ erro: 'A mídia (foto/vídeo) é obrigatória.' });
        }
        const { titulo, preco, quartos } = req.body;

        const novoImovel = await Imovel.create({
            titulo: titulo,
            preco: preco,
            quartos: quartos,
            url_da_midia: req.file.path,
            tipo_arquivo: req.file.mimetype
        });

        res.status(201).json({
            mensagem: 'Imóvel cadastrado com sucesso no banco de dados!',
            imovel: novoImovel
        });
    } catch (error) {
        console.error("Erro ao salvar imóvel:", error);
        res.status(500).json({ erro: 'Falha ao cadastrar o imóvel no sistema.' });
    }
});

app.get('/imoveis', async (req, res) => {
    try {
      const imoveis = await Imovel.find().sort({ createdAt: -1 }); // O sort(-1) traz os mais recentes primeiro
        res.json(imoveis);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao buscar imóveis.' });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});