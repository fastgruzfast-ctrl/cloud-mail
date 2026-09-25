/** 新邮件桌面通知：仅在用户开启开关、页面不可见、已授权时弹出 */
export function notifyNewMail(email) {
    let enabled = false
    try {
        enabled = !!JSON.parse(localStorage.getItem('setting') || '{}').notifyNewMail
    } catch (e) {
    }
    if (!enabled) return
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return
    if (!document.hidden) return
    if (!email) return
    try {
        const title = email.subject || 'New Email'
        const body = email.name ? `${email.name} <${email.sendEmail || ''}>` : (email.sendEmail || '')
        const n = new Notification(title, {body})
        n.onclick = () => {
            window.focus()
            n.close()
        }
    } catch (e) {
        console.error(e)
    }
}
