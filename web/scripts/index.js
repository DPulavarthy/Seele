let ipc = void 0;
let date = 0;
let sun = { time: 0, interval: void 0, type: void 0 };
let uptime = { time: 0, interval: void 0 };
let refresh = { time: 0, interval: void 0 };
let devices = {};
const { style } = document.documentElement;


try {
    ipc = require("electron").ipcRenderer;
    request = query => ipc.sendSync('request', query)
} catch (e) { }

function $(query, parent) {
    return (parent || document).querySelector(query);
}

function zero(number, hundred) {

    // Check if the number should be checked against 100.
    if (hundred) {

        // Check if the number is less than 10.
        if (number < 10) return `00${number}`

        // Check if the number is less than 100.
        if (number < 100) return `0${number}`

        // Return the number.
        return number.toString()
    } else {

        // Check if the number is less than 10.
        if (number < 10) return `0${number}`

        // Return the number.
        return number.toString()
    }
}

function time() {
    const time = new Date()
    $('.time').innerHTML = `${zero(time.toLocaleTimeString().split(':')[0])}:${zero(time.getMinutes())}`;
    $('.time').setAttribute('meridian', time.toLocaleTimeString().split(' ')[1]);
    $('.date').innerHTML = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function notif(msg) {
    $('.notification').classList.add('active')
    loop()

    function loop(i = 11) {
        $('.notification .head').innerHTML = `${msg} Please wait ${i - 1} second${(i - 1) !== 1 ? 's' : ''}!`
        --i !== 0 ? setTimeout(_ => loop(i), 1000) : close()
    }

    function close() {
        $('.notification').classList.remove('active')
        setTimeout(_ => {
            $('main').classList.add('refresh')
            setTimeout(_ => $('main').classList.remove('refresh'), 1000)
        }, 400)
    }
}

function timify(ms, short) {
    if (typeof ms === 'string') return ms;
    let sec = +(ms / 1000).toFixed(0);
    let min = Math.floor(sec / 60);
    let hrs = min > 59 ? Math.floor(min / 60) : 0;
    min -= hrs * 60;
    sec = Math.floor(sec % 60);

    const result = [];
    hrs ? result.push(`${hrs.toLocaleString()} ${short ? 'hr' : 'hour'}${hrs === 1 ? '' : 's'}`) : void 0;
    min ? result.push(`${min} ${short ? 'min' : 'minute'}${min === 1 ? '' : 's'}`) : void 0;
    sec ? result.push(`${(min || hrs) ? 'and ' : ''} ${sec} ${short ? 'sec' : 'second'}${sec === 1 ? '' : 's'}`.trim()) : void 0;

    return result.length ? result.join(' ') : (short ? '0 secs' : '0 seconds');
};

function pinged(ms) {
    let hrs = Math.floor(ms / 3600000)
    let min = Math.floor((ms % 3600000) / 60000)
    let sec = +((ms % 60000) / 1000).toFixed(0);
    if (sec === 60) {
        sec = 0;
        min++;
    }
    if (min === 60) {
        min = 0;
        hrs++;
    }

    return `${hrs > 999 ? hrs.toLocaleString() : zero(hrs)}:${zero(min)}:${zero(sec)}`
}

function readable(utc) {
    const time = new Date(utc)
    return `${zero(time.toLocaleTimeString().split(':')[0])}:${zero(time.getMinutes())} ${time.toLocaleTimeString().split(' ')[1]}`
}

window.onload = async _ => {
    time()
    date = setInterval(time, 1000 * 5);
    // $('main').classList.add('refresh')
    // setTimeout(_ => $('main').classList.remove('refresh'), 1000)
}

ipc.on('event', (event, param) => {
    switch (param.key) {
        case 'uptime': {
            uptime.time = param.value;
            uptime.interval = setInterval(_ => $('div.uptime p').innerHTML = timify(Date.now() - uptime.time, !0), 500)
            break;
        }

        case 'refresh': {
            if (param.preloader) {
                notif('Force reload requested.');

                if (uptime.interval) {
                    clearInterval(uptime.interval);
                    uptime.interval = setInterval(_ => $('div.uptime p').innerHTML = timify(Date.now() - uptime.time, !0), 500);
                }

                for (const device in devices) {
                    clearInterval(devices[device].interval);
                    devices[device].interval = setInterval(_ => $(`#${device} .pinged`).innerHTML = pinged(Date.now() - devices[device].time), 500)
                }

                if (sun.interval) {
                    clearInterval(sun.interval);
                    sun.interval = setInterval(_ => $('section.overview .sun').innerHTML = `${sun.type} in: <p>${timify(sun.time - Date.now() > 0 ? sun.time - Date.now() : 'Now', !0)}</p>`, 500)
                }

                clearInterval(date);
                date = setInterval(time, 1000 * 5);
            }

            refresh.time = param.value + (param.preloader ? (1000 * 11) : 0);

            if (refresh.interval) clearInterval(refresh.interval);
            refresh.interval = setInterval(_ => $('div.refresh p').innerHTML = timify(Date.now() - refresh.time, !0), 500)
            break;
        }

        case 'ips': {
            const time = Date.now();
            const build = ['<div class="online" this><div class="icon"></div><div class="name">Seele</div></div>'];
            for (const device of param.value) {
                build.push(`<div ${device.alive ? 'class="online"' : ''} id="${device.id.toLowerCase().replace(/\s/g, '')}">`)
                build.push(`<div class="icon" style="background: var(--${device.os})"></div>`)
                build.push(`<div class="name">${device.id}</div>`)
                build.push('<div class="pinged">00:00:00</div>')
                build.push('</div>')
            }

            $('section.chkip').innerHTML = build.join('');
            for (const device of param.value) {
                const id = device.id.toLowerCase().replace(/\s/g, '');
                if (!devices[id]) devices[id] = { alive: device.alive, id, time, interval: setInterval(_ => $(`#${id} .pinged`).innerHTML = pinged(Date.now() - devices[id].time), 500) }
                else if (devices[id] && device.alive !== devices[id].alive) {
                    devices[id].alive = device.alive;
                    devices[id].time = time;
                    $(`#${id}`).classList[device.alive ? 'add' : 'remove']('online')
                }
            }
            break
        }

        case 'tmp': {
            $('section.temps .big img').src = param.value.icon
            $('section.temps .header h3').innerHTML = param.value.city
            $('section.temps .header div').innerHTML = param.value.feel
            $('section.temps .temp img').src = param.value.icon
            $('section.temps .temp h1').innerHTML = param.value.temp
            $('section.temps .summary').innerHTML = param.value.summary
            $('section.temps .phase p').innerHTML = param.value.phase
            $('section.temps .wind p').innerHTML = param.value.wind
            $('section.temps .humidity p').innerHTML = param.value.humidity
            $('section.temps .visibility p').innerHTML = param.value.visibility
            $('section.temps .pressure p').innerHTML = param.value.pressure
            $('section.temps .dew p').innerHTML = param.value.dew

            $('section.extra p').innerHTML = readable(param.value.upcoming.time)
            $('section.extra img').src = param.value.upcoming.type === 'sunrise' ? '../icons/sunrise.svg' : '../icons/sunset.svg'

            $('section.forecast').innerHTML = param.value.forecast.slice(0, 4).map(d => {
                const build = ['<div>'];
                build.push(`<img src="${d.icon}" />`)
                build.push(`<div>`)
                build.push(`<div class="day">${d.day}</div>`)
                build.push('<div class="info">')
                build.push(`<div before="High">${d.high}</div>`)
                build.push(`<div before="Low">${d.low}</div>`)
                build.push(`</div></div></div>`)
                return build.join('')
            }).join('')

            sun.time = param.value.upcoming.time
            sun.type = param.value.upcoming.type

            if (!$('section.overview .sun').innerHTML.startsWith(sun.type)) {
                document.body.classList[sun.type === 'sunrise' ? 'add' : 'remove']('night')

                $('section.temps').style.opacity = sun.type === 'sunrise' ? 0.2 : 1;
                $('section.extra').style.opacity = sun.type === 'sunrise' ? 0.2 : 1;
                $('section.split').style.opacity = sun.type === 'sunrise' ? 0.2 : 1;
            }


            $('section.overview .sun').innerHTML = `${sun.type} in: <p>${timify(sun.time - Date.now() > 0 ? sun.time - Date.now() : 'Now', !0)}</p>`
            if (sun.interval) clearInterval(sun.interval);
            sun.interval = setInterval(_ => $('section.overview .sun').innerHTML = `${sun.type} in: <p>${timify(sun.time - Date.now() > 0 ? sun.time - Date.now() : 'Now', !0)}</p>`, 500)
            break
        }

        case 'bat': {
            style.setProperty('--bat', `${param.charging ? param.value - 5 : param.value}%`);
            style.setProperty('--bat-ac', param.charging ? '5%' : '0%')
            $(`.${param.key} div`).setAttribute('percent', `${param.value}%`)
            break
        }

        default: {
            if (param.value >= 75) style.setProperty(`--${param.key}-color`, 'var(--red)')
            else if (param.value >= 50) style.setProperty(`--${param.key}-color`, 'var(--yellow)')
            else style.setProperty(`--${param.key}-color`, 'var(--main)')
            style.setProperty(`--${param.key}`, `${param.value}%`);
            $(`.${param.key} div`).setAttribute('percent', `${param.value}%`)
            break
        }
    }
})