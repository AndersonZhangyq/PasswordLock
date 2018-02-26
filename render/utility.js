const fs = require('fs')
const { ipcRenderer } = require('electron')
const crypto = require('crypto')
const algorithm = 'aes-192-ctr'

exports.encrypt = (text, pwd) => {
    cipher = crypto.createCipher(algorithm, pwd)
    encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return encrypted
}

exports.decrypt = (text, pwd) => {
    decipher = crypto.createDecipher(algorithm, pwd)
    decrypted = decipher.update(text, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
}

let setting_path = './settings.json', data_path = './pwd-data.json'

fs.open(setting_path, 'r', (err, fd) => {
    if (err) {
        if (err.code === 'ENOENT') {
            $('#new-unlock-code-modal').modal('toggle')
        }
        console.log(err)
    } else {
        fs.readFile(fd, (err, data) => {
            if (err)
                console.log(err)
            else {
                ipcRenderer.send('enableEdit')
                data = JSON.parse(data.toString())
                settingReady = new CustomEvent('settingReady', {
                    detail: {
                        settings: data
                    }
                })
                document.dispatchEvent(settingReady)

                // read password data
                fs.open(data_path, 'r', (err, fd) => {
                    if (err) {
                        console.log(err)
                    } else {
                        fs.readFile(fd, (err, data) => {
                            if (err)
                                console.log(err)
                            else {
                                data = JSON.parse(data.toString())
                                pwdDataReady = new CustomEvent('pwdDataReady', {
                                    detail: {
                                        pwdData: data
                                    }
                                })
                                document.dispatchEvent(pwdDataReady)
                            }
                        })
                    }
                })
            }
        })
    }
})

exports.saveData = () => {
    pwdTable = $('#password-table')
    allData = pwdTable.bootstrapTable('getData')
    if (allData && allData[0] && allData[0].tagName === 'TABLE')
        allData = []
    fs.writeFile(data_path, JSON.stringify(allData), (err) => {
        if (err)
            console.log(err)
    })
}

exports.setUnlockCode = () => {
    unlockCode = document.getElementById('newUnlockCode').value
    retype = document.getElementById('retypeUnlockCode').value
    newUnlockCodeError = document.getElementById('newUnlockCodeError')
    retypeUnlockCodeError = document.getElementById('retypeUnlockCodeError')
    newUnlockCodeError.innerHTML = ' '
    retypeUnlockCodeError.innerHTML = ' '
    hasError = false
    if (unlockCode === undefined || (unlockCode = unlockCode.trim()).length < 6) {
        document.getElementById('newUnlockCodeError').innerHTML = 'Space or empty string is not valid! At least 6 characters!'
        hasError = true
    }
    if (unlockCode != retype) {
        document.getElementById('retypeUnlockCodeError').innerHTML = 'Must be the same unlock code! Please check!'
        hasError = true
    }

    if (hasError)
        return
    ipcRenderer.send('enableEdit')

    $('#new-unlock-code-modal').modal('toggle')

    seed = Math.random().toString()

    settingReady = new CustomEvent('settingReady', {
        detail: {
            settings: {
                'unlockCodeChecker': exports.encrypt(seed, unlockCode),
                'seed': seed
            }
        }
    })

    // save settings
    fs.writeFile(setting_path, JSON.stringify(settingReady.detail.settings), (err) => {
        if (err)
            console.log(err)
    })

    document.dispatchEvent(settingReady)
}