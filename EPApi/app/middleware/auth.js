import User from '../models/user.js'

const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.userId)
        if(!user) {
            return res.status(404).json({
                success: false,
                message: 'Felhasználó nem található'
            })
        }
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Ez a fiók felfüggesztésre került.'
            });
        }
        if(user.roleId === 2) {
            next()
        }else {
            return res.status(403).json({
                success: false,
                message: 'Ehhez a művelethez Admin jogosultság szükséges!'
            })
        }
    }catch(err) {
        return res.status(500).json({
            success: false,
            message: err.message
        })
    }
}

export default isAdmin
