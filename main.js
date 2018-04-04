var submitButton = document.querySelector(".credit-form__submit"); 
submitButton.addEventListener("click", calculate); 
var arrayKeys = ["sum", "length","rate", "type", "firstPayment"]; // массив с названиями переменных для проверки
var months = ['Январь', 'Февраль', 'Март', 'Апрель','Май', 'Июнь', 'Июль', 'Август','Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
// функция проверки значений
function checkData(){
    var inputDataNodes = document.querySelectorAll(".line__input"); // массив элементов для проверки
    var inputDataJson = {}; // JSON куда будут добавляться проверенные данные
    var isDataValid = true;
    var spanValidityNodes = document.querySelectorAll(".line__validity-checker"); // массив элементов, которые будут показываться, если значения неправильные
    // основной цикл проверки
    for (var index = 0; index < inputDataNodes.length; index++) {
        var node = inputDataNodes[index]; // элемент для проверки
        var value = node.value; // его значение
        var span = spanValidityNodes[index]; // span справа от элемента, показывается, если значение неправильное
        if (node.type !== "date"){ // дата по-умолчанию верна, ее смысла проверять нет
            if (parseFloat(value) == value && parseInt(value)>0){ // проверка число ли это и больше или равно 0 значение
                span.classList.remove("line__validity-checker_invalid"); // очистить span
                inputDataJson[arrayKeys[index]] =  inputDataNodes[index].value; // добавить значение
            } else {
                isDataValid = false; 
                span.classList.add("line__validity-checker_invalid"); // включить span
            }   
        } else {
            inputDataJson[arrayKeys[index]] =  new Date(inputDataNodes[index].value); // если Date - создать дату
        }  
    }
    if (inputDataNodes[1].value == 0) { // если количество месяцев = 0 - ошибка
        isDataValid = false; 
        spanValidityNodes[1].classList.add("line__validity-checker_invalid");}
    return {"valid" : isDataValid, "data" : inputDataJson} // возвращает JSON - корректно ли и данные
}

function calculate(){ // рассчет данных
    var checkedData = checkData(); // получает JSON с провереными данными
    var shortInfo = document.querySelector(".short-info");  // элемент с первым блоком информации
    var table = document.querySelector(".info-table"); // элемент таблица
    var payments = "";
    if (checkedData.valid) { // если данные верны
        table.style.display = "table"; // включить таблицу
        shortInfo.style.display = "block"; // и блок с краткими данными
        var shortInfoNodes = document.querySelectorAll(".short-info>.line>.line__text_money>span"); // элементы для мин\макс цены и переплаты
        if (checkedData.data.type == 1) { // аннуитетный
            payments = annuityPayment(checkedData.data);
            shortInfoNodes[0].innerHTML = addSpaces(payments.maxPayment); // одно значение в сумме оплаты в месяц
        } else { //дифференцированный
            payments = differentiationPayment(checkedData.data);
            shortInfoNodes[0].innerHTML =  addSpaces(payments.maxPayment) + " ... " +  addSpaces(payments.minPayment); // два значения, мин и макс
        }       
        shortInfoNodes[1].innerHTML =  addSpaces(payments.overdraft); // переплата
        document.querySelector("table>tbody").innerHTML = fillTable(payments.data); // заполнение таблицы
    } else { // если значения неправильны - скрыть таблицу и блок с краткой информацией
        shortInfo.style.display = "none"; 
        table.style.display = "none";
    }
}
function annuityPayment(data){ // рассчет аннуитетного платежа
    var sum = data.sum, //сумма платежа
    length = data.length, //количество месяцев
    rate = data.rate/100, // процентная ставка
    overdraft, monthPayment; 
    monthPayment = ((sum * rate / 12) / (1-1/Math.pow((1+rate/12), length))); // формула рассчета платы за месяц
    overdraft = monthPayment*length - sum; // переплата
    var paymentsJSON = []; 
    var debt = sum; // сумма нынешнего долга
    var month = new Date(data.firstPayment); // первая плата
    for (var i = 0; i<length; i++){
        debt = (debt - (sum/length)); // уменьшение долга
        paymentsJSON.push({
            "paymentNum" : i+1, 
            "paymentDate" : (months[month.getMonth()] + ", " + month.getFullYear()), 
            "payment" : monthPayment, 
            "realPart" : (sum/length), 
            "creditPart" : (monthPayment-(sum/length)), 
            "debt" : debt
        }); // информация по каждому месяцу. Номер оплаты, дата оплаты, сумма платежа, реальная и кредитная часть + сумма долга
        month.setMonth(month.getMonth() + 1); // + месяц
    }
    return {
        "overdraft" : parseInt(overdraft), // переплата
        "minPayment": parseInt(monthPayment), // минимальная
        "maxPayment": parseInt(monthPayment), // и максимальная плата за месяц. Тут равны
        "data": paymentsJSON 
    }
}

function differentiationPayment(data){ // тоже самое для дифф. платежа
    var sum = data.sum, 
    length = data.length, 
    rate = data.rate/100, 
    monthPayment = 0, 
    totalSum = 0, 
    maxPayment;
    var paymentsJSON = [];
    var debt = sum;
    maxPayment = ((sum/length) + debt*rate/12); // с различиями для максимального платежа
    var month = new Date(data.firstPayment);
    for (var i = 0; i<length; i++){
        monthPayment = ((sum/length) + debt*rate/12); // и способа рассчета оплаты за месяц
        totalSum += parseFloat(monthPayment); // подсчет переплаты
        debt = (debt - (sum/length)); // меняющаяся сумма долга
        paymentsJSON.push( {
            "paymentNum" : i+1, 
            "paymentDate" : (months[month.getMonth()] + ", " + month.getFullYear()), 
            "payment" : monthPayment, 
            "realPart" : (sum/length), 
            "creditPart" : (debt*rate/12), 
            "debt" : debt // инфа за каждый месяц. Номер оплаты, дата оплаты, сумма платежа, реальная и кредитная часть + сумма долга
        });
        month.setMonth(month.getMonth() + 1);
    }
    return {
        "overdraft" : parseInt(totalSum - sum), // переплата
        "minPayment": parseInt(monthPayment), //мин. месяц
        "maxPayment": parseInt(maxPayment), // макс. месяц
        "data": paymentsJSON // оплаты
    }
}
function addSpaces(x) { // добавление пробелов через каждые 3 разряда 10000=> 10 000
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
function fillTable(json){ // заполнение таблицы
    var tableHTML = "";
    for (var i=0; i<json.length; i++){
        tableHTML +=
        '<tr>' +
            '<td>'+json[i].paymentNum+'</td>'+
            '<td>'+json[i].paymentDate+'</td>'+
            '<td>'+addSpaces((json[i].payment).toFixed(2))+'</td>'+
            '<td>'+addSpaces((json[i].realPart).toFixed(2))+'</td>'+
            '<td>'+addSpaces((json[i].creditPart).toFixed(2))+'</td>'+
            '<td>'+addSpaces((json[i].debt).toFixed(2))+'</td>'+
        '</tr>'; //Номер оплаты, дата оплаты, сумма платежа, реальная и кредитная часть + сумма долга
    }
    return tableHTML;
}