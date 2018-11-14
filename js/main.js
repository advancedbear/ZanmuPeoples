var zanmu_history = {}
var tweet_d = null, tweet_s = null
$(document).ready(function () {
    $('.modal').modal()
    var datepicker = $('.datepicker').datepicker({
        setDefaultDate: true,
        defaultDate: new Date(),
        maxDate: new Date()
    });
    $(document).on('click', '.datepicker-done', () => {
        pickedDate = new Date(datepicker[0].value)
        if (zanmu_history[getDateFormat(pickedDate)] != undefined) {
            getNowDate(zanmu_history[getDateFormat(pickedDate)], (d) => {
                calcSaraly(new Date(`${d.year}-${d.month}-${d.date} ${$("#teiji_setting").val()}`),
                    d.Obj, JSON.parse(localStorage.settings).hourly_wage, 
                    (di, s) => {
                        if(s>0) $("#history-zanmu").css("color", "red")
                        else $("#history-zanmu").css("color", "black")
                        $('#history-date').text(pickedDate.toLocaleDateString('japanese'))
                        $('#history-time').text(new Date(zanmu_history[getDateFormat(pickedDate)]).toLocaleTimeString('japanese'))
                        $("#history-zanmu").text(`${('0'+Math.floor(di/3600000)).slice(-2)}:${('0'+Math.floor(di%3600000/60000)).slice(-2)}:${('0'+Math.floor(di%3600000%60000/1000)).slice(-2)}`)
                        $("#history-money").text(s+"円")
                        $('#history-view').modal('open');
                    })
            })
        } else {
            alert("退勤時刻の登録がありません")
        }
    })
    setInterval(function () {
        updateDate()
    }, 6000)
    if (!localStorage.zanmu_history) localStorage.zanmu_history = '{}'
    zanmu_history = JSON.parse(localStorage.zanmu_history)
    if (!localStorage.settings) localStorage.settings = JSON.stringify({
        leaving_time: "17:30",
        hourly_wage: 1100,
        share_zanmu: true,
        share_salary: true
    })
    setTimeout(()=>{$("#leaving-time").text(JSON.parse(localStorage.settings).leaving_time)}, 50)
    updateDate()
    if (zanmu_history[getDateFormat(new Date())]) {
        getNowDate(zanmu_history[getDateFormat(new Date())], (d) => {
            calcSaraly(new Date(`${d.year}-${d.month}-${d.date} ${$("#teiji_setting").val()}`),
                d.Obj, JSON.parse(localStorage.settings).hourly_wage, 
                (di, s) => {
                    $("#share").removeClass('disabled')
                    tweet_d = d
                    tweet_s = s
                }
            )
        })
    }
})

var getNowDate = function (dateObj, callback) {
    if (dateObj == undefined) dateObj = new Date()
    else dateObj = new Date(dateObj)
    let dateArray = {
        Obj: dateObj,
        year: dateObj.getFullYear(),
        month: (1 + dateObj.getMonth()),
        date: dateObj.getDate(),
        hour: dateObj.getHours(),
        minute: dateObj.getMinutes(),
        second: dateObj.getSeconds()
    }
    callback(dateArray)
}

var taikin = function () {
    getNowDate(null, (d) => {
        M.toast({
            html: `${('0' + d.hour).slice(-2)}:${('0' + d.minute).slice(-2)} に退勤しました`
        })
        tweet_d = d
        tweet_s = $("#today-wage").text().slice(-1)
        zanmu_history[d.year + '' + d.month + '' + d.date] = d.Obj
    })
    localStorage.zanmu_history = JSON.stringify(zanmu_history)
    $("#share").removeClass('disabled')
}

var share = function () {
    console.log("share")
    let zanmu_time = tweet_d!=null ? JSON.parse(localStorage.settings).share_zanmu ? "本日は"+('0' + tweet_d.hour).slice(-2)+":"+('0' + tweet_d.minute).slice(-2)+"まで残務しました。%0a" : "" : ""
    let zanmu_salary = tweet_s!=null ? JSON.parse(localStorage.settings).share_salary?"残業代として"+tweet_s+"円稼ぎました。%0a":"":""
    window.open("https://twitter.com/share?text="+zanmu_time+zanmu_salary+"%23残務の民&url=&original_referer=", "tweetwindow", "width=400,height=300")
}

var shareHistory = function(obj) {
    window.open("https://twitter.com/share?text="+$("#history-date").text()+"は"+$("#history-time").text()+"に退勤し、"+$("#history-zanmu").text()+"残務しました。残業代として"+$("#history-money").text()+"稼ぎました%20%23残務の民&url=&original_referer=", "tweetwindow", "width=400,height=300")
}

var updateDate = function () {
    getNowDate(null, (d) => {
        $("#date").text(`${('0' + d.year).slice(-2)}/${('0' + d.month).slice(-2)}/${('0' + d.date).slice(-2)}`)
        $("#clock").text(`${('0' + d.hour).slice(-2)}:${('0' + d.minute).slice(-2)}`)
        if (zanmu_history[getDateFormat(d.Obj)]) {
            console.log(zanmu_history[getDateFormat(d.Obj)])
            calcSaraly(new Date(`${d.year}-${d.month}-${d.date} ${$("#teiji_setting").val()}`),
                new Date(zanmu_history[getDateFormat(d.Obj)]),
                $("#tanka_setting").val(),
                (di, s) => {
                    if(di > 0) {
                        $("#today-wage").text(s+"円")
                        $("#today-wage").css("color", "red")
                        $("#today-overtime").text(`${Math.floor(di/3600000)}:${Math.floor(di%3600000/60000)}`)
                        $("#today-overtime").css("color", "red")
                    } else {
                        $("#today-wage").text("0円")
                        $("#today-wage").css("color", "black")
                        $("#today-overtime").text("00:00")
                        $("#today-overtime").css("color", "black")
                    }
                }
            )
        } else {
            calcSaraly(new Date(`${d.year}-${d.month}-${d.date} ${$("#teiji_setting").val()}`),
                new Date(),
                $("#tanka_setting").val(),
                (di, s) => {
                    if(di > 0) {
                        $("#today-wage").text(s+"円")
                        $("#today-wage").css("color", "red")
                        $("#today-overtime").text(`${Math.floor(di/3600000)}:${Math.floor(di%3600000/60000)}`)
                        $("#today-overtime").css("color", "red")
                    } else {
                        $("#today-wage").text("0円")
                        $("#today-wage").css("color", "black")
                        $("#today-overtime").text("00:00")
                        $("#today-overtime").css("color", "black")
                    }
                }
            )
        }
    })
}

var calcSaraly = function(l_time, z_time, h_wage, callback) {
    let saraly = 0
    l_time = new Date(l_time)
    z_time = new Date(z_time)
    time_22 = new Date(l_time).setHours(22,0,0,0)
    if(z_time - time_22 > 0) {
        saraly += (z_time - time_22)/3600000 * h_wage * 1.5
        saraly += (time_22 - l_time)/3600000 * h_wage * 1.25
    } else {
        saraly += (z_time - l_time)/3600000 * h_wage * 1.25
    }
    diff = z_time - l_time
    callback(diff, Math.round(saraly))
}

var getDateFormat = function (dateObj) {
    return new Date(dateObj).getFullYear() + ''
        + ('0' + (1 + new Date(dateObj).getMonth())).slice(-2) + ''
        + ('0' + new Date(dateObj).getDate()).slice(-2)
}

var saveSettings = function () {
    let localsettings = {
        leaving_time: $("#teiji_setting").val(),
        hourly_wage: $("#tanka_setting").val(),
        share_zanmu: $("#check_share_zanmu").prop('checked'),
        share_salary: $("#check_share_money").prop('checked')
    }
    $("#leaving-time").text(localsettings.leaving_time)
    localStorage.settings = JSON.stringify(localsettings)
}

var loadSettings = function () {
    $("#teiji_setting").val(JSON.parse(localStorage.settings).leaving_time)
    $("#tanka_setting").val(JSON.parse(localStorage.settings).hourly_wage)
    $("#check_share_zanmu").prop('checked', JSON.parse(localStorage.settings).share_zanmu)
    $("#check_share_money").prop('checked', JSON.parse(localStorage.settings).share_salary)
}