const Contato = require('./models/Contato');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const upload = require('./config/cloudinary');
const Imovel = require('./models/Imovel');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('./models/Usuario');

const app = express();

app.use(cors());
app.use(express.json());

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Banco de Dados conectado!'))
    .catch((erro) => console.error('Erro no banco:', erro));

app.get('/', (req, res) => {
    res.json({'message': 'API da imobiliaria funcionando!'});
});


app.post('/imoveis', upload.array('galeria', 15), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ erro: 'Envie pelo menos uma foto.' });
        }  
        const { 
            titulo, descricao, tipo_imovel, finalidade, destaque,
            preco, valor_condominio, iptu,
            area_util, quartos, suites, banheiros, vagas,
            endereco, bairro, latitude, longitude,
            comodidades_imovel, comodidades_condominio 
        } = req.body;

        const linksDasFotos = req.files.map(file => file.path);

        const novoImovel = await Imovel.create({
            titulo, descricao, tipo_imovel, finalidade, 
            destaque: destaque === 'true' || destaque === true,
            preco, valor_condominio, iptu,
            area_util, quartos, suites, banheiros, vagas,
            endereco, bairro, 
            latitude: parseFloat(latitude), 
            longitude: parseFloat(longitude),
            comodidades_imovel: comodidades_imovel ? comodidades_imovel.split(',') : [],
            comodidades_condominio: comodidades_condominio ? comodidades_condominio.split(',') : [],
            galeria: linksDasFotos
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
      const imoveis = await Imovel.find().sort({ createdAt: -1 });
        res.json(imoveis);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao buscar imóveis.' });
    }
});

app.patch('/imoveis/:id/visualizacao', async (req, res) => {
    try {
        await Imovel.findByIdAndUpdate(req.params.id, { $inc: { visualizacoes: 1 } });
        res.status(200).send();
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao contar visualização.' });
    }
});

app.post('/contatos', async (req, res) => {
    try {
        const { 
            nome, telefone, email, 
            melhor_horario, meio_contato_ideal, tipo_negocio, 
            mensagem, data_visita, hora_visita, imovel_id 
        } = req.body;

        const novoContato = await Contato.create({
            nome, telefone, email, melhor_horario, meio_contato_ideal, 
            tipo_negocio, mensagem, data_visita, hora_visita, imovel_id
        });

        const transporter = nodemailer.createTransport({
            service: 'gmail', // Vamos usar o Gmail para disparar
            auth: {
                user: process.env.EMAIL_SISTEMA, 
                pass: process.env.SENHA_SISTEMA
            }
        });

        let linkWhatsapp = '';
        if (meio_contato_ideal === 'WhatsApp') {
            const numeroLimpo = telefone.replace(/\D/g, '');
           linkWhatsapp = `<br><br><a href="https://wa.me/55${numeroLimpo}" style="display: inline-block; background-color: #25D366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">Falar no WhatsApp agora</a>`;
        }

        const configuracaoEmail = {
            from: process.env.EMAIL_SISTEMA,
            to: 'caueadolfooliveira2k18@gmail.com',
            subject: `🚨 Novo Interessado: ${nome} - ${tipo_negocio}`,
            html: `
                <h2>Você tem um novo lead no site!</h2>
                <p><strong>Nome:</strong> ${nome}</p>
                <p><strong>Telefone:</strong> ${telefone}</p>
                <p><strong>Email:</strong> ${email}</p>
                <hr>
                <p><strong>Preferência de Contato:</strong> ${meio_contato_ideal} (${melhor_horario})</p>
                <p><strong>Mensagem:</strong> ${mensagem || 'Nenhuma mensagem extra.'}</p>
                <p><strong>Visita Agendada:</strong> ${data_visita ? `${data_visita} às ${hora_visita}` : 'Não solicitou visita'}</p>
                ${linkWhatsapp}
            `
        };

        await transporter.sendMail(configuracaoEmail);

        res.status(201).json({ 
            mensagem: 'Obrigado! O seu pedido de contato foi enviado com sucesso.',
            contato: novoContato 
        });

    } catch (error) {
        console.error("Erro ao salvar contato:", error);
        res.status(500).json({ erro: 'Não foi possível enviar o seu contato agora.' });
    }
});

app.post('/admin/cadastrar', async (req, res) => {
    try {
        const { email, senha } = req.body;

        const usuarioExiste = await Usuario.findOne({ email });
        if (usuarioExiste) {
            return res.status(400).json({ erro: 'Este e-mail já está cadastrado.' });
        }
        
        const salt = await bcrypt.genSalt(10);
        const senhaCriptografada = await bcrypt.hash(senha, salt);

        const novoUsuario = await Usuario.create({
            email,
            senha: senhaCriptografada
        });

        res.status(201).json({ mensagem: 'Conta de administrador criada com sucesso!' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao criar conta de administrador.' });
    }
});

app.post('/admin/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        const usuario = await Usuario.findOne({ email });
        if (!usuario) {
            return res.status(400).json({ erro: 'E-mail ou senha incorretos.' });
        }

        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
        if (!senhaCorreta) {
            return res.status(400).json({ erro: 'E-mail ou senha incorretos.' });
        }

        const token = jwt.sign(
            { id: usuario._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' }
        );

        res.status(200).json({
            mensagem: 'Login efetuado com sucesso!',
            token: token

        });

    } catch (error) {
        res.status(500).json({ erro: 'Erro ao processar o login.' });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});