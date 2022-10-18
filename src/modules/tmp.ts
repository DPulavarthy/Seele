// Import dependencies.
import { Intervalizer } from '#manager';
import { request } from 'https';
import { Transform as Stream } from 'stream';
import { Options } from '#manager';
import { parse, HTMLElement } from 'node-html-parser';

interface Data {
    city: string;
    summary: string;
    sky: string;
    wind: number;
    humidity: number;
    visibility: number;
    pressure: number;
    dew: number;
    feel: number;
    temp: number;
    icon: string;
    forecast: ({
        day: string;
        icon: string;
        high: number | string;
        low: number;
    })[];
    sunrise: number;
    sunset: number;
    upcoming: {
        type: string;
        time: number;
    },
    phase: string;
}

export default class Tmp extends Intervalizer {

    // Store the module data.
    private static data: Data

    /**
     * Execute the module logic.
     * 
     * @return {Promise<void>}
     */
    public static async run(): Promise<void> {

        // Declare the data object.
        Tmp.data = {} as Data

        // Get the weather site data.
        const tmp = await Tmp.request(`https://www.msn.com/en-us/weather/forecast/in-${Options('tmp')}`);
        const sun = await Tmp.request(`https://www.timeanddate.com/astronomy/${Options('sun')}`)

        // Scrape the site for weather information.
        Tmp.data.city = tmp.querySelector('#WeatherOverviewLocationName a')?.rawText ?? 'Unknown';
        Tmp.data.summary = tmp.querySelector('#CurrentWeatherSummary p')?.rawText.split('.')[0] ?? 'Unknown';
        Tmp.data.sky = tmp.querySelector('.summaryCaptionCompact-E1_1')?.rawText ?? 'Unknown';
        Tmp.data.wind = parseInt(tmp.querySelector('#CurrentDetailLineWindValue')?.rawText ?? '0')
        Tmp.data.humidity = parseInt(tmp.querySelector('#CurrentDetailLineHumidityValue')?.rawText ?? '0')
        Tmp.data.visibility = +parseFloat(tmp.querySelector('#CurrentDetailLineVisibilityValue')?.rawText ?? '0').toFixed(2)
        Tmp.data.pressure = +parseFloat(tmp.querySelector('#CurrentDetailLinePressureValue')?.rawText ?? '0').toFixed(2)
        Tmp.data.dew = parseInt(tmp.querySelector('#CurrentDetailLineDewPointValue')?.rawText ?? '0')
        Tmp.data.feel = parseInt(tmp.querySelector('.summaryCaptionAndFeelLikeContainerCompact-E1_1 a div:last-child')?.rawText ?? '0')
        Tmp.data.temp = parseInt(tmp.querySelector('#OverviewCurrentTemperature a')?.rawText ?? '0')
        Tmp.data.icon = tmp.querySelector('#OverviewCurrentTemperature img')?.getAttribute('src') ?? 'Unknown';
        Tmp.data.forecast = tmp.querySelectorAll('#ForecastDays > div > ul > li').map(e => {
            const high = e.querySelector('.tempPart-E1_1 > div:first-child')?.rawText ?? '0';
            return {
                day: e.querySelector('p')?.rawText ?? 'Unknown',
                icon: e.querySelector('img')?.attributes.src ?? 'Unknown',
                high: !isNaN(parseInt(high)) ? parseInt(high) : '--',
                low: parseInt(e.querySelector('.tempPart-E1_1 > div:last-child')?.rawText ?? '0')
            }
        })

        // Scrape the site for sunrise and sunset information.
        Tmp.data.sunrise = Tmp.sun(sun.querySelector('.bk-focus__info tbody tr:nth-child(2) td')?.innerHTML.match(/\d{1,2}:\d{1,2}\s(am|pm)/g)?.shift() ?? '0:00 am')
        Tmp.data.sunset = Tmp.sun(sun.querySelector('.bk-focus__info tbody tr:nth-child(3) td')?.innerHTML.match(/\d{1,2}:\d{1,2}\s(am|pm)/g)?.shift() ?? '0:00 am')

        // Scrape the site for current sky phase.
        const phase = sun.querySelector('#cs-info tr:last-child #cs-phase')?.rawText;
        Tmp.data.phase = phase ? (phase.is('day') ? 'Day' : 'Night') : 'Unknown';

        // Scrape the site for upcoming sun information.
        const upcoming = Tmp.sun(sun.querySelector('#as-monthsun tr:nth-child(2) td:nth-child(2)')?.rawText ?? '0:00 am', !0);
        if (Date.now() > Tmp.data.sunrise && Date.now() < Tmp.data.sunset) {
            // If the current time is between the sunrise and sunset times then set the upcoming sun information to sunset.
            Tmp.data.upcoming = {
                type: 'sunset',
                time: Tmp.data.sunset
            }
        } else {
            // Otherwise check if it's before sunrise or after sunset, if it's before then set the upcoming sun information to sunrise, if it's after then set the upcoming sun information to sunrise tomorrow.
            Tmp.data.upcoming = {
                type: 'sunrise',
                time: Date.now() > Tmp.data.sunset ? upcoming : Tmp.data.sunrise
            }
        }

        // Emit the tmp event.
        win.webContents.send('event', { key: 'tmp', value: Tmp.data })

        // Clear the data after weather data has been sent.
        Tmp.data = {} as Data
    }

    /** 
     * Fetch's the URLs HTML and parses it.
     * 
     * @param {string} url
     * @return {Promise<HTMLElement>}
     */
    private static request(url: string): Promise<HTMLElement> {
        return new Promise(resolve => {
            request(url, site => {
                const raw = new Stream();

                site.on('data', data => raw.push(data))

                site.on('end', () => resolve(parse(raw.read())))
            }).end()
        })
    }

    /**
     * Converts a time to a formatted string.
     * 
     * @param {number} number raw number.
     * @param {boolean} hundred if the number should be checked against 100 instead of 10.
     * @return {number}
     */
    private static zero(number: number, hundred?: boolean): string {

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

    /**
     * Converts a time to a number.
     * 
     * @param {string} time raw time.
     * @return {number}
     */
    private static sun(time: string, tomorrow?: boolean): number {

        // Split the time into hours and minutes.
        let hour = parseInt(time.match(/\d{1,2}(?=:)/g)?.shift() ?? '0')
        const min = parseInt(time.match(/(?<=:)\d{1,2}(?=\s)/g)?.shift() ?? '0')

        // Check for AM or PM and convert the time to 24 hour format.
        const meridian = time.trim().endsWith('pm')

        if (meridian && hour !== 12) hour += 12
        else if (!meridian && hour === 12) hour = 0

        // Return the time.
        return new Date(Date.parse(`${new Date().toISOString().match(/\d{4}(-\d{2}){2}T/g)?.shift()}${Tmp.zero(hour)}:${Tmp.zero(min)}:00.000-05:00`)).getTime() + (tomorrow ? (1000 * 60 * 60 * 24) : 0)
    }
}
