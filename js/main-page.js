const START_EDIT = 'none', CANCEL = 'editing'

let pwdTable = $('#password-table')

function rowNumberFormatter(value, row, index) {
    // Here row can be regarded as passing by 'reference'
    row.index = index
    return index + 1
}

function passowrdFormatter(value, row, index) {
    // ATTENTION!! Unreliable!! v1.11.0
    // from source code, found #1714-1715  value = calculateObjectValue(column, that.header.formatters[j], [value, item, i], value);
    // and #143  return func.apply(self, args);
    // here self is column, so in current function, this === self === column
    field = this.field
    return `<div class="input-group">
                <input class="form-control input-sm" type="password" value="000000" readonly>
                <span class="input-group-addon glyphicon-ok show-glyphicon" style="display: none" onclick="changePassword(${index}, '${field}')"></span>
                <span class="input-group-addon glyphicon-eye-open show-glyphicon" onclick="toggleShowPassword()" data-row-unique-id="${row.index}"></span>
            </div>`
}
function plainTextFormatter(value, row, index) {
    // ATTENTION!! Unreliable!! v1.11.0
    // from source code, found #1714-1715  value = calculateObjectValue(column, that.header.formatters[j], [value, item, i], value);
    // and #143  return func.apply(self, args);
    // here self is column, so in current function, this === self === column
    field = this.field
    // when no data to show, show '+'
    cell = ''
    if (value.length === 0)
        cell = `<a class="show-glyphicon glyphicon-plus" onclick="toggleEdit()" data-edit-state="none">${value}</a>`
    else
        cell = `<a href="#" onclick="toggleEdit()" data-edit-state="none">${value}</a>`
    return cell +
        `<div class="input-group" style="display: none">
                <input class="form-control input-sm" type="text" value=${value}>
                <span class="input-group-addon glyphicon-ok show-glyphicon" onclick="changePlainText(${index}, '${field}')" data-edit-state="editing"></span>
                <span class="input-group-addon show-glyphicon" onclick="toggleEdit()" data-old-value="${value}" data-edit-state="editing"></span>
            </div>`
}

function toggleEdit(call_element) {
    callEelement = call_element === undefined ? this.event.toElement : call_element
    switch (callEelement.dataset.editState) {
        case START_EDIT:
            callEelement.style.display = 'none'
            divElement = callEelement.nextElementSibling
            divElement.style.display = ''
            divElement.lastElementChild.className = 'input-group-addon glyphicon-remove show-glyphicon'
            manager.isEditing += 1
            console.log(`now: ${manager.isEditing}`)
            break
        case CANCEL:
            divElement = callEelement.parentElement
            oldValue = callEelement.dataset.oldValue
            divElement.firstElementChild.value = oldValue
            divElement.style.display = 'none'
            divElement.previousElementSibling.style.display = ''
            divElement.lastElementChild.className = 'input-group-addon show-glyphicon'
            manager.isEditing -= 1
            console.log(`now: ${manager.isEditing}`)
            break
    }
}

function toggleShowPassword() {
    triggerSpan = this.event.toElement
    confirm = triggerSpan.previousElementSibling
    coInput = confirm.previousElementSibling
    if (coInput.readOnly) {
        $('#unlock-modal').modal('toggle')
        document.getElementById('checkUnlockCode').dataset.currentRowUniqueId = triggerSpan.dataset.rowUniqueId
    } else {
        // hide password
        coInput.type = 'password'
        coInput.value = '000000'
        coInput.readOnly = true
        triggerSpan.className = 'input-group-addon glyphicon-eye-open show-glyphicon'
        confirm.style.display = 'none'
        manager.isEditing -= 1
        console.log(`now: ${manager.isEditing}`)
    }
}

function changePlainText(index, field) {
    newData = this.event.toElement.previousElementSibling.value
    pwdTable.bootstrapTable('updateCell', { 'index': index, 'field': field, 'value': newData })

    toggleEdit(this.event.toElement)
}

function changePassword(index, field) {
    pwd = manager.tmpPwd
    newData = this.event.toElement.previousElementSibling.value
    pwdTable.bootstrapTable('updateCell', { 'index': index, 'field': field, 'value': utility.encrypt(newData, pwd) })
    document.dispatchEvent(new Event('removeTmp'))

    this.event.toElement.nextElementSibling.click();
}

document.addEventListener('changePwd', (e) => {
    // show password
    coInput.type = 'text'
    coInput.value = e.detail.truePwd
    coInput.readOnly = false
    triggerSpan.className = 'input-group-addon glyphicon-eye-close show-glyphicon'
    confirm.style.display = ''
    manager.isEditing += 1
    console.log(`now: ${manager.isEditing}`)
})