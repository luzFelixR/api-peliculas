const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'contraseña_segura_pruebas'; 

app.use(express.json());

// 1. CONFIGURACIÓN DE SEQUELIZE Y SQLITE (Adaptado para PostgreSQL en Render)
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    logging: false 
});

// 2. DEFINICIÓN DE MODELOS

const Pelicula = sequelize.define('Pelicula', {
    titulo: { type: DataTypes.STRING, allowNull: false },
    director: { type: DataTypes.STRING, allowNull: false },
    anio: { type: DataTypes.INTEGER, allowNull: false },
    genero: { type: DataTypes.STRING, allowNull: true }
});

const Usuario = sequelize.define('Usuario', {
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

sequelize.sync({ alter: true })
    .then(() => console.log('Base de datos SQLite sincronizada exitosamente con usuarios.'))
    .catch(err => console.error('Error al sincronizar la base de datos:', err));


// 3. MIDDLEWARE DE AUTORIZACIÓN (JWT)
const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        return res.status(403).json({ error: 'Acceso denegado. No se proporcionó un token.' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(403).json({ error: 'Formato de token inválido. Use "Bearer [token]"' });
    }

    try {
        // Verificamos el token con nuestra clave secreta
        const verificado = jwt.verify(token, JWT_SECRET);
        req.usuario = verificado; // Guardamos los datos del usuario en la petición por si los necesitamos
        next(); // Continuamos a la ruta solicitada
    } catch (error) {
        res.status(401).json({ error: 'Token inválido o expirado.' });
    }
};


// 4. RUTAS DE AUTENTICACIÓN

app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y password son obligatorios' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const nuevoUsuario = await Usuario.create({
            email,
            password: hashedPassword
        });

        res.status(201).json({ mensaje: 'Usuario registrado con éxito', usuario: { id: nuevoUsuario.id, email: nuevoUsuario.email } });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
        }
        res.status(500).json({ error: 'Error al registrar el usuario' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const usuario = await Usuario.findOne({ where: { email } });
        if (!usuario) {
            return res.status(404).json({ error: 'Credenciales inválidas (Usuario no encontrado).' });
        }

        const passwordValido = await bcrypt.compare(password, usuario.password);
        if (!passwordValido) {
            return res.status(401).json({ error: 'Credenciales inválidas (Contraseña incorrecta).' });
        }

        // Si todo está bien, generamos el JWT (expira en 2 horas)
        const token = jwt.sign(
            { id: usuario.id, email: usuario.email },
            JWT_SECRET,
            { expiresIn: '2h' }
        );

        res.json({ mensaje: 'Autenticación exitosa', token });
    } catch (error) {
        res.status(500).json({ error: 'Error en el proceso de login' });
    }
});


// 5. RUTAS DE LA API DE PELÍCULAS (Protegidas con el middleware 'verificarToken')

// GET: Obtener todas las películas (Ahora requiere estar logueado)
app.get('/api/peliculas', verificarToken, async (req, res) => {
    try {
        const peliculas = await Pelicula.findAll();
        res.json(peliculas);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las películas' });
    }
});

// POST: Crear una nueva película (Protegido)
app.post('/api/peliculas', verificarToken, async (req, res) => {
    try {
        const nuevaPelicula = await Pelicula.create({
            titulo: req.body.titulo,
            director: req.body.director,
            anio: req.body.anio,
            genero: req.body.genero
        });
        res.status(201).json({ mensaje: 'Película creada', pelicula: nuevaPelicula });
    } catch (error) {
        res.status(400).json({ error: 'Error al crear la película, datos inválidos' });
    }
});

// PUT: Actualizar una película por ID (Protegido)
app.put('/api/peliculas/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const pelicula = await Pelicula.findByPk(id);
        if (!pelicula) {
            return res.status(404).json({ error: 'Película no encontrada' });
        }
        await pelicula.update(req.body);
        res.json({ mensaje: 'Película actualizada correctamente', pelicula });
    } catch (error) {
        res.status(400).json({ error: 'Error al actualizar la película' });
    }
});

// DELETE: Eliminar una película por ID (Protegido)
app.delete('/api/peliculas/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const filasBorradas = await Pelicula.destroy({ where: { id } });
        if (filasBorradas === 0) {
            return res.status(404).json({ error: 'Película no encontrada' });
        }
        res.json({ mensaje: 'Película eliminada correctamente de la base de datos' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar la película' });
    }
});

// Iniciar Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor de películas ejecutándose en el puerto ${PORT}`);
});