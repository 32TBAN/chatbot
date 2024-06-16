const pool = require('../db')

const getPaymentByIdProject = async (req, res, next) => {
    const { idProject } = req.params
    try {
        const result = await pool.query('SELECT * FROM PAYMENTS WHERE ID_PROYECT= $1;',[idProject])
        res.json(result.rows)
    } catch (error) {
        next(error)
    }
}

const getNewClients = async (req, res, next) => {
    try {
        const result = await pool.query(
            "SELECT id, name, phone, email FROM users WHERE created_at > now() - interval '30 days';"
        );
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
};

const getPortfolio = async (req, res, next) => {
    try {
        const result = await pool.query(
            "SELECT id, name, status, deliver_date FROM projects WHERE status IN ('Planificación', 'Diseño', 'Implementación');"
        );
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
};

const getCollectedPortfolio = async (req, res, next) => {
    try {
        const result = await pool.query(
            "SELECT id, name, status, deliver_date FROM projects WHERE status IN ('Despliegue', 'Mantenimiento');"
        );
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
};

const getAllPlatments = async (req, res, next) => {
    try {
        const result = await pool.query("SELECT * FROM PAYMENTS")
        res.json(result.rows)
    } catch (error) {
        next(error)
    }
}

module.exports = {
    getPaymentByIdProject,
    getNewClients,
    getPortfolio,
    getCollectedPortfolio, getAllPlatments
};