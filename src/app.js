import Vue from 'vue';
/* eslint-disable */ 
import $ from 'jquery';
import lunar from './lunar';
function queryExternalData(cb) {
  $.getJSON('https://raw.githubusercontent.com/Yao-JSON/vue-calendar/master/data.json', (res) => {
    cb(res)
  })
}

const s = 1000;
const m = 60 * s;
const h = 60 * m;
const day = h * 24;
const week = day * 7;

function getExternalData(y, m) {
  const now = new Date().getTime();
  const query = `${y}年${m + 1}月`;
  const data = localStorage.getItem(`calendarData:${query}`);

  if (data && now - data.time <= week) {
    try {
      return Promise.resolve(JSON.parse(data));
    } catch (e) {
      // empty
    }
  }

  return new Promise((resolve) => {
    queryExternalData((res) => {
      const { almanac, holidaylist,  } = res;
      const { holidayStatus = {}, holidayFestival = [], almanac: almanacRes } = res[query] || {};

      const data = {holidayStatus, holidayFestival, almanac: {...almanac, ...almanacRes}, holidaylist, time: now};

      localStorage.setItem(`calendarData:${query}`, JSON.stringify(data));
      resolve(data);
    });
  });
}

function pad(n) {
  let str = String(n);
  if (str.length < 2) {
    str = `0${str}`;
  }
  return str;
}

let almanacData = {};

const defaultHolidayList = [
  {
    "name": "元旦",
    "startday": "2019-1-1"
  },
  {
    "name": "劳动节",
    "startday": "2019-5-1"
  },
  {
    "name": "国庆节",
    "startday": "2019-10-1"
  }
]

const prepared = {};

let holidayStatus = {};
let holidayList = {};
let holidayFestival = [];


const WEEKS = [
  { name: '日', id: 0 },
  { name: '一', id: 1 },
  { name: '二', id: 2 },
  { name: '三', id: 3 },
  { name: '四', id: 4 },
  { name: '五', id: 5 },
  { name: '六', id: 6 },
];

function getDateData(y, m, d, other) {
  const dx = new Date(y, m, d);
  const day = dx.getDay();
  const fulldate = `${y}-${m + 1}-${d}`;
  const lunarRes = lunar(dx);
  let almanac = lunarRes.term || lunarRes.lDate;
  const festival = lunarRes.festival();
  if (festival.length > 0) {
    almanac = festival[0].desc;
  }
  return {
    fulldate,
    date: d,
    month: m,
    year: y,
    almanac,
    work: (fulldate in holidayStatus) && holidayStatus[fulldate] === '2',
    rest: (fulldate in holidayStatus) && holidayStatus[fulldate] === '1',
    festival: lunarRes.term || festival.length > 0,
    day,
    other,
    weekend: day === 0 || day === 6,
  };
}

function prepareExternalData(year, month, callback) {
  const fullmonth = `${year}-${month}`;
  if (prepared[fullmonth]) {
    return;
  }
  prepared[fullmonth] = true;

  getExternalData(year, month).then((res) => {
    if (!res) return;
    const { almanac } = res;
    const holidaylistRes = res.holidaylist;
    holidayFestival = res.holidayFestival;
    almanacData = almanac;
  
    holidayStatus = res.holidayStatus;

    for(let key in holidaylistRes) {
      Vue.set(holidayList, key, holidaylistRes[key])
    }
    callback(fullmonth);
  });
}

function fillExternal(fullmonth, target) {
  if (fullmonth in target) {
    target[fullmonth].forEach((item) => {
      if (item.fulldate in holidayStatus) {
        if (holidayStatus[item.fulldate] === '2') {
          Vue.set(item, 'work', true);
        } else if (holidayStatus[item.fulldate] === '1') {
          Vue.set(item, 'rest', true);
        }
      }
    });
  }
}

/**
 * get month data
 * @param {number} year 2018
 * @param {number} month 0 - 11
 */
function getMonthData(year, month, startDay) {
  const d = new Date(year, month, 1);
  const day = d.getDay();
  const diffWeek = day - (startDay % 7);
  const data = [];
  let datepos = (diffWeek < 0 ? -6 : 1) - diffWeek;
  let realDate;
  let realMonth;
  let realYear;
  let i = 0;
  do {
    d.setDate(datepos);
    realYear = d.getFullYear();
    realDate = d.getDate();
    realMonth = d.getMonth();
    if (realMonth === month + 1 && i % 7 === 0) {
      break;
    }

    data.push(getDateData(
      realYear, realMonth, realDate,
      realMonth !== month,
    ));

    datepos = realDate + 1;
    i += 1;
  } while (i < 42);

  return data;
}
export default {
  name: 'my-calendar',
  data() {
    const years = [];
    for (let year = 1900; year <= 2050; year += 1) {
      years.push(year);
    }
    const months = [];
    for (let month = 0; month < 12; month += 1) {
      months.push(month);
    }
    const startDay = 1;
    const today = new Date();
    const days = {};
    const cYear = today.getFullYear();
    const cMonth = today.getMonth();
    const cDate = today.getDate();
    const weeks = WEEKS.slice();
    if (startDay > 0) {
      const inserts = weeks.splice(0, startDay);
      weeks.splice(weeks.length, 0, ...inserts);
    }
    days[`${cYear}-${cMonth}`] = getMonthData(cYear, cMonth, startDay);
    prepareExternalData(cYear, cMonth, (f) => {
      fillExternal(f, days);
    });
    return {
      startDay,
      cYear,
      cMonth,
      cDate,
      today: `${cYear}-${cMonth + 1}-${cDate}`,
      years,
      months,
      days,
      weeks,
      almanacData,
      holidayStatus,
      holidayList
    };
  },
  computed: {
    fullMonth() {
      return `${this.cYear}-${this.cMonth}`;
    },
    currentDays() {
      return this.days[this.fullMonth];
    },
    currentHolidayList() {
      return this.holidayList[this.cYear] || defaultHolidayList;
    },
    selected() {
      return `${this.cYear}-${this.cMonth + 1}-${this.cDate}`;
    },
    selectedFormat() {
      const day = (new Date(this.cYear, this.cMonth, this.cDate)).getDay();
      return `${this.cYear}-${pad(this.cMonth + 1)}-${pad(this.cDate)} 星期${WEEKS[day].name}`;
    },
    lunarDetail() {
      const dx = new Date(this.cYear, this.cMonth, this.cDate);
      const ret = lunar(dx);
      return {
        gzDate: ret.gzDate,
        gzMonth: ret.gzMonth,
        gzYear: ret.gzYear,
        animal: ret.animal,
        lDate: ret.lDate,
        lMonth: ret.lMonth,
      };
    },
    almanacDetail() {
      return almanacData[this.selected] || { avoid: '', suit: '' };
    },
    isHolidayFestival() {
      return holidayFestival.indexOf(this.selected) !== -1;
    },
    holiday() {
      return this.isHolidayFestival ? this.selected : '';
    },
  },
  watch: {
    startDay(val) {
      prepareExternalData(this.cYear, this.cMonth, (f) => {
        fillExternal(f, this.days);
      });
      const weeks = WEEKS.slice();
      if (val > 0) {
        const inserts = weeks.splice(0, val);
        weeks.splice(weeks.length, 0, ...inserts);
      }
      this.weeks = weeks;
      this.days = {
        [this.fullMonth]: getMonthData(this.cYear, this.cMonth, val),
      };
    },
    cYear(val) {
      const fullMonth = `${val}-${this.cMonth}`;
      if (!(fullMonth in this.days)) {
        this.days[fullMonth] = getMonthData(val, this.cMonth, this.startDay);
      }
      prepareExternalData(val, this.cMonth, (f) => {
        fillExternal(f, this.days);
      });
    },
    cMonth(val) {
      const fullMonth = `${this.cYear}-${val}`;
      if (!(fullMonth in this.days)) {
        this.days[fullMonth] = getMonthData(this.cYear, val, this.startDay);
      }
      prepareExternalData(this.cYear, val, (f) => {
        fillExternal(f, this.days);
      });
    },
  },
  methods: {
    changeDate(item) {
      this.cYear = item.year;
      this.cMonth = item.month;
      this.cDate = item.date;
    },
    selectHoliday(fulldate) {
      const [y, m, d] = fulldate.split('-').map(k => parseInt(k, 10));
      const x = new Date(y, m - 1, d);
      this.cYear = x.getFullYear();
      this.cMonth = x.getMonth();
      this.cDate = x.getDate();
    },
    changeYear(year) {
      const d = new Date(year, this.cMonth, this.cDate);
      if (d.getDate() !== this.cDate) {
        d.setDate(0);
      }
      this.cYear = d.getFullYear();
      this.cMonth = d.getMonth();
      this.cDate = d.getDate();
    },
    changeMonth(month) {
      const d = new Date(this.cYear, month, this.cDate);
      if (d.getDate() !== this.cDate) {
        d.setDate(0);
      }
      this.cYear = d.getFullYear();
      this.cMonth = d.getMonth();
      this.cDate = d.getDate();
    },
    prevMonth() {
      const d = new Date(this.cYear, this.cMonth - 1, this.cDate);
      if (d.getDate() !== this.cDate) {
        d.setDate(0);
      }
      this.cYear = d.getFullYear();
      this.cMonth = d.getMonth();
      this.cDate = d.getDate();
    },
    nextMonth() {
      const d = new Date(this.cYear, this.cMonth + 1, this.cDate);
      if (d.getDate() !== this.cDate) {
        d.setDate(0);
      }
      this.cYear = d.getFullYear();
      this.cMonth = d.getMonth();
      this.cDate = d.getDate();
    },
    goToday() {
      const today = new Date();
      this.cYear = today.getFullYear();
      this.cMonth = today.getMonth();
      this.cDate = today.getDate();
    },
  },
};