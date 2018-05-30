/**
 * Created by liangzhimin@chinaso.com on 2018/5/24
 */

function checkLogin(req, res, next) {
    if (!req.session.user) {
        req.flash('error', '用户未登录')
        res.redirect('/login')
    }
    next()
}

function checkNotLogin(req, res, next) {
    if (req.session.user) {
        req.flash('error', '用户已登录')
        res.redirect('back')
    }
    next()
}

module.exports = {
    checkLogin,
    checkNotLogin
}