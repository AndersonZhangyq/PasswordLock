const { ipcRenderer } = require('electron')
const remote = require('electron').remote
const dialog = remote.dialog
const crypto = require('crypto')
const algorithm = 'aes-192-ctr'

ipcRenderer.on('Add-password', addPasswordHandler)

ipcRenderer.on('Add-multi-password', () => {
    $('#multi-password-modal').modal('toggle')
})

let settings = {}, passwords = [], pwdTable = $('#password-table')

document.addEventListener('settingReady', (e) => {
    settings = e.detail.settings
    $('#password-table').on('post-body.bs.table', utility.saveData)
})

document.addEventListener('removeTmp', () => {
    exports.tmpPwd = ''
})

document.addEventListener('pwdDataReady', (e) => {
    pwdTable.bootstrapTable('load', e.detail.pwdData)
})

function decrypt(text, pwd) {
    decipher = crypto.createDecipher(algorithm, pwd)
    decrypted = decipher.update(text, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
}

function encrypt(text, pwd) {
    cipher = crypto.createCipher(algorithm, pwd)
    encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return encrypted
}

function addPasswordHandler() {
    if (exports.isEditing !== 0) {
        dialog.showMessageBox({
            type: 'warning',
            buttons: ['Discard all unsaved change', 'Cancel'],
            defaultId: 1,
            message: 'If you continue, all changes not submited will be discarded!',
            cancelId: 1,
        }, (response) => {
            if (response == 0) {
                $('.glyphicon-remove').each((index, item) => {
                    item.click()
                })
                $('.glyphicon-eye-close').each((index, item) => {
                    item.click()
                })
                $('#edit-password-data').modal('toggle')
            }
        })
    } else
        $('#edit-password-data').modal('toggle')
}

exports.addPasswordHandler = addPasswordHandler

exports.appendPassowrd = () => {
    document.getElementById('edit-unlockCodeError').innerHTML = ' '
    unlock_code = document.getElementById('unlock_code').value
    if (settings.seed !== decrypt(settings.unlockCodeChecker, unlock_code)) {
        document.getElementById('edit-unlockCodeError').innerHTML = 'Invalid unlock code!'
        return
    }
    web_site = document.getElementById('webSite').value
    username = document.getElementById('username').value
    passowrd = document.getElementById('password').value
    remark = document.getElementById('remark').value
    pwdTable.bootstrapTable('append', [{
        index: pwdTable.bootstrapTable('getData').length + 1,
        webSite: web_site,
        username: username,
        password: encrypt(passowrd, unlock_code),
        remark: remark
    }])
    $('#edit-password-data').modal('toggle')
}

exports.isEditing = 0;

exports.checkUnlockCode = () => {
    document.getElementById('check-unlockCodeError').innerHTML = ' '
    unlock_code = document.getElementById('unlockCode').value
    if (settings.seed === decrypt(settings.unlockCodeChecker, unlock_code)) {
        exports.tmpPwd = unlock_code
        encrytedPwd = pwdTable.bootstrapTable('getRowByUniqueId', event.toElement.dataset.currentRowUniqueId)
        changePwdEvent = new CustomEvent('changePwd', {
            detail: {
                truePwd: decrypt(encrytedPwd.password, unlock_code)
            }
        })
        $('#unlock-modal').modal('toggle')
        document.dispatchEvent(changePwdEvent)
    } else {
        document.getElementById('check-unlockCodeError').innerHTML = 'Invalid unlock code!'
    }
}

exports.removePasswordHandler = () => {
    if (document.querySelector('[name="btSelectAll"]').checked) {
        dialog.showMessageBox({
            type: 'warning',
            buttons: ['Delete all selected', 'Cancel'],
            defaultId: 1,
            message: 'Are you sure you want to delete all selected items? It cannot undo!',
            cancelId: 1,
        }, (response) => {
            if (response == 0) {
                pwdTable.bootstrapTable('removeAll')
            }
        })
        return
    }
    ids = $.map(pwdTable.bootstrapTable('getSelections'), function (row) {
        return row.index;
    });
    if (ids && ids.length !== 0) {
        dialog.showMessageBox({
            type: 'warning',
            buttons: ['Delete all selected', 'Cancel'],
            defaultId: 1,
            message: 'Are you sure you want to delete all selected items? It cannot undo!',
            cancelId: 1,
        }, (response) => {
            if (response == 0) {
                pwdTable.bootstrapTable('remove', { 'field': 'index', 'values': ids })
            }
        })
    }
}

exports.addMultiPasswordHandler = () => {
    document.getElementById('m_check-unlockCodeError').innerHTML = ' '
    data = document.getElementById('multiPwdTextarea').value.trim()
    if (data.length == 0){
        $('#multi-password-modal').modal('toggle')
        return
    }
    unlock_code = document.getElementById('m_unlockCode').value
    if (settings.seed !== decrypt(settings.unlockCodeChecker, unlock_code)) {
        document.getElementById('m_check-unlockCodeError').innerHTML = 'Invalid unlock code!'
        return
    }
    splited = data.split('\n')
    origin_data = pwdTable.bootstrapTable('getData')
    data_to_add = []
    count = origin_data.length + 1
    splited.forEach((value, index) => {
        values = value.split(';')
        remark_value = "";
        if (values.length < 3)
            return
        if (values.length === 4)
            remark_value = values[3]
        data_to_add.push({
            index: count,
            webSite: values[0],
            username: values[1],
            password: encrypt(values[2], unlock_code),
            remark: remark_value
        })
        count++
    })
    pwdTable.bootstrapTable('append',data_to_add)
    $('#multi-password-modal').modal('toggle')
}