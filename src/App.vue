<template>
<div id="my-calendar" :class="{holidaystyle: isHolidayFestival}">
  <div class="calendar-left">
    <div class="controls">
      <el-select
        class="year-control"
        :value="cYear"
        @change="changeYear"
        placeholder="请选择"
        size="mini"
      >
        <el-option
          v-for="year in years"
          :key="year"
          :label="year + '年'"
          :value="year">
        </el-option>
      </el-select>
      <el-button type="mini" icon="el-icon-arrow-left" @click="prevMonth"></el-button>
      <el-select
        class="month-control"
        :value="cMonth"
        @change="changeMonth"
        placeholder="请选择"
        size="mini"
      >
        <el-option
          v-for="month in months"
          :key="month"
          :label="(month + 1) + '月'"
          :value="month">
        </el-option>
      </el-select>
      <el-button type="mini" icon="el-icon-arrow-right" @click="nextMonth"></el-button>
      <el-select
        class="holiday-control"
        :value="holiday"
        @change="selectHoliday"
        placeholder="假期安排"
        size="mini"
      >
        <el-option
          v-for="holiday in currentHolidayList"
          :key="holiday.startday"
          :label="holiday.name"
          :value="holiday.startday">
        </el-option>
      </el-select>
      <el-button class="returntoday" type="mini" @click="goToday">返回今天</el-button>
    </div>
    <div class="days-table">
      <div class="days-head">
        <span
          class="days-week"
          :class="{weekend: week.id === 0 || week.id === 6}"
          :key="week.id" v-for="week in weeks"
        >
          {{week.name}}
        </span>
      </div>
      <div class="days" :class="{rows6: currentDays.length > 35}">
        <div
          class="rili-cell"
          :key="item.fullDate"
          v-for="item in currentDays"
          :class="{
            festival: item.festival,
            rest: item.rest,
            work: item.work,
            weekend: item.weekend,
            other: item.other,
            today: item.fulldate === today,
            selected: item.fulldate === selected
          }"
          @click="changeDate(item)"
        >
          <span class="holiday-sign" v-if="item.rest">休</span>
          <span class="holiday-sign" v-else-if="item.work">班</span>
          <span class="rili-number">{{item.date}}</span>
          <span class="rili-almanac">{{item.almanac}}</span>
        </div>
      </div>
    </div>
  </div>
  <div class="calendar-right">
    <div class="format-date">{{selectedFormat}}</div>
    <div class="big-date">{{cDate}}</div>
    <div class="lunar-detail">
      <span>{{lunarDetail.lMonth}}月{{lunarDetail.lDate}}</span>
      <span>{{lunarDetail.gzYear}}年 【{{lunarDetail.animal}}年】</span>
      <span>{{lunarDetail.gzMonth}}月 {{lunarDetail.gzDate}}日</span>
    </div>
    <div class="almanac-detail">
      <div class="almanac-suit">
        <i>宜</i>
        <p :key="suit" v-for="suit in almanacDetail.suit.split('.', 5)">
          <span v-if="suit">
            {{suit}}
          </span>
        </p>
      </div>
      <div class="almanac-avoid">
        <i>忌</i>
        <p :key="avoid" v-for="avoid in almanacDetail.avoid.split('.', 5)">
          <span v-if="avoid">
           {{avoid}}
          </span>
        </p>
      </div>
    </div>
  </div>
</div>
</template>

<script src="./app.js"></script>
