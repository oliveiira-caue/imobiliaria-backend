const express = require('express');
const cors = require('cors');
require('dotenv').config();
const upload = require('./config/cloudinary');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({'message': 'API da imobiliaria funcionando!'});
});

app.post('/upload', upload.single('midia'), (req, res) => {
    try {
      if (!req.file) {
            return res.status(400).json({ erro: 'Nenhum arquivo recebido. Verifique o nome do campo.' });
        }
      res.json({ 
            mensagem: 'Upload feito com sucesso!',
            tipo_arquivo: req.file.mimetype,
            url_da_midia: req.file.path
            });
    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Falha ao enviar a mídia' });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});