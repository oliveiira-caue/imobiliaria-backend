const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const upload = require('./config/cloudinary');
const Imovel = require('./models/Imovel');
const Contato = require('./models/Contato');
const Usuario = require('./models/Usuario');
const auth = require('./middleware/auth');

const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Banco de Dados conectado!'))
    .catch((erro) => console.error('❌ Erro no banco:', erro));


app.get('/', (req, res) => {
    res.json({'message': 'API da imobiliaria funcionando!'});
});

app.get('/imoveis', async (req, res) => {
    try {
        const { 
            tipo, finalidade, cidade, bairro, 
            minPreco, maxPreco, quartos, tipo_finalidade 
        } = req.query;

        let filtros = {};
        if (tipo) filtros.tipo_imovel = tipo;
        if (finalidade) filtros.finalidade = finalidade;
        if (cidade) filtros.cidade = new RegExp(cidade, 'i');
        if (bairro) filtros.bairro = new RegExp(bairro, 'i');
        if (tipo_finalidade) filtros.tipo_finalidade = tipo_finalidade;

        if (minPreco || maxPreco) {
            filtros.preco = {};
            if (minPreco) filtros.preco.$gte = Number(minPreco);
            if (maxPreco) filtros.preco.$lte = Number(maxPreco);
        }

        if (quartos) {
            filtros.quartos = Number(quartos) >= 4 ? { $gte: 4 } : Number(quartos);
        }

        const imoveis = await Imovel.find(filtros).sort({ createdAt: -1 });
        res.json(imoveis);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao filtrar imóveis.' });
    }
});


app.post('/imoveis', auth, upload.array('galeria', 15), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ erro: 'Envie pelo menos uma foto.' });
        }

        const novoImovel = new Imovel({
            ...req.body, // Pega todos os textos do formulário React
            destaque: req.body.destaque === 'true' || req.body.destaque === true,
            latitude: parseFloat(req.body.latitude) || 0,
            longitude: parseFloat(req.body.longitude) || 0,
            galeria: req.files.map(file => file.path) // Fotos do Cloudinary
        });

        await novoImovel.save();
        res.status(201).json({ mensagem: 'Imóvel cadastrado com sucesso!', imovel: novoImovel });
    } catch (error) {
        console.log("❌ ERRO NO CADASTRO:", error);
        res.status(500).json({ erro: error.message });
    }
});


app.delete('/imoveis/:id', auth, async (req, res) => {
    try {
        await Imovel.findByIdAndDelete(req.params.id);
        res.json({ mensagem: 'Imóvel removido!' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao remover.' });
    }
});


app.post('/contatos', async (req, res) => {
    try {
        const novoContato = await Contato.create(req.body);
        

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_SISTEMA, pass: process.env.SENHA_SISTEMA }
        });

        const configuracaoEmail = {
            from: process.env.EMAIL_SISTEMA,
            to: 'caueadolfooliveira2k18@gmail.com',
            subject: `🚨 Novo Interessado: ${req.body.nome}`,
            html: `<h2>Você tem um novo lead!</h2><p>Nome: ${req.body.nome}</p>`
        };

        await transporter.sendMail(configuracaoEmail);
        res.status(201).json({ mensagem: 'Contato enviado!', contato: novoContato });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao enviar contato.' });
    }
});


app.post('/admin/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        const usuario = await Usuario.findOne({ email });
        if (!usuario) return res.status(400).json({ erro: 'E-mail ou senha incorretos.' });

        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
        if (!senhaCorreta) return res.status(400).json({ erro: 'E-mail ou senha incorretos.' });

        const token = jwt.sign({ id: usuario._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(200).json({ token });
    } catch (error) {
        res.status(500).json({ erro: 'Erro no login.' });
    }
});


app.post('/admin/cadastrar', async (req, res) => {
    try {
        const { email, senha } = req.body;
        const salt = await bcrypt.genSalt(10);
        const senhaCriptografada = await bcrypt.hash(senha, salt);
        await Usuario.create({ email, senha: senhaCriptografada });
        res.status(201).json({ mensagem: 'Admin criado!' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao criar admin.' });
    }
});

// --- INICIALIZAÇÃO ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));