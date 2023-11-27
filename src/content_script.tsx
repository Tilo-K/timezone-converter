const timezones: { [id: string]: number } = {
  PST: -8,
  PT: -8,
  PDT: -7,
  MST: -7,
  MDT: -6,
  CST: -6,
  CDT: -5,
  EST: -5,
  ET: -5,
  EDT: -4,
  AKST: -9,
  AKDT: -8,
  HST: -10,
  HDT: -9,
  GMT: +0,
  BST: +1,
  CET: +1,
  CEST: +2,
  EET: +2,
  EEST: +3,
  AEST: +10,
  AEDT: +11,
  ACST: +9.5,
  ACDT: +10.5,
  NZST: +12,
  NZDT: +13,
};

const numbersorcol = "0123456789:";

const selector = "h1, h2, h3, h4, h5, p, li, td, caption, span, a";

backgroundTask();

function backgroundTask() {
  const nodes = getAllTextNodes();

  for (const node of nodes) {
    if (containsTimezone(node.innerHTML)) {
      const replaceText = replaceTime(node.innerHTML);
      if (replaceText !== node.innerHTML) {
        node.innerHTML = replaceText;
      }
    }
  }
}

document.addEventListener(
  "DOMNodeInserted",
  function (e) {
    try {
      const node = e.target as HTMLElement;
      const nodes = node.querySelectorAll<HTMLElement>(selector);
      for (const node of nodes) {
        if (containsTimezone(node.innerHTML)) {
          const replaceText = replaceTime(node.innerHTML);
          if (replaceText !== node.innerHTML) {
            node.innerHTML = replaceText;
          }
        }
      }
    } catch (err) {}
  },
  false
);

function getAllTextNodes() {
  return document.querySelectorAll<HTMLElement>(selector);
}

function containsTimezone(text: string) {
  if (!text) return null;

  for (const timezone in timezones) {
    if (text.toLocaleLowerCase().includes(timezone.toLocaleLowerCase())) {
      return timezone;
    }
  }

  if (text.toLocaleUpperCase().includes("UTC")) {
    let result = "UTC";
    let index = text.indexOf("UTC");

    if (index === text.length - 1) {
      return result;
    }

    if (index + 3 === text.length) {
      return result;
    }

    if (text[index + 3] !== "+" && text[index + 3] !== "-") {
      return result;
    }

    result += text[index + 3];

    for (let i = index + 4; i < text.length; i++) {
      const c = text[i];
      if (numbersorcol.includes(c)) {
        result += c;
      } else {
        break;
      }
    }

    return result;
  }

  return null;
}

function isValidDate(d: Date) {
  return d instanceof Date && !isNaN(d.valueOf());
}

function getTimeString(text: string) {
  text = text.toLocaleLowerCase();
  text = text.trim();

  const hasAMPM = text.includes("am") || text.includes("pm");

  let foundAMPM = false;
  let foundM = false;

  let result = "";

  for (let i = text.length - 1; i >= 0; i--) {
    const c = text[i].toLocaleLowerCase();

    if (c === " ") {
      result = c + result;
      continue;
    }

    if (c === "m" && hasAMPM && !foundAMPM && !foundM) {
      foundM = true;
      result = c + result;
      continue;
    }

    if ((c === "a" || c === "p") && hasAMPM && !foundAMPM && foundM) {
      foundAMPM = true;
      result = c + result;
      continue;
    }

    if (numbersorcol.includes(c) && (!hasAMPM || foundAMPM)) {
      result = c + result;
      continue;
    }

    if (!numbersorcol.includes(c)) {
      break;
    }
  }

  return result.trim();
}

function toHours(timeString: string) {
  timeString = timeString.toLocaleLowerCase();
  timeString = timeString.trim();

  let hours = 0;

  if (timeString.includes("pm")) {
    hours += 12;
    timeString = timeString.replace("pm", "");
  }

  if (timeString.includes("am")) {
    timeString = timeString.replace("am", "");
  }

  if (timeString.includes(":")) {
    const parts = timeString.split(":");
    hours += parseInt(parts[1]) / 60;
    timeString = timeString.replace(":" + parts[1].toString(), "");
  }

  hours += parseInt(timeString);

  return hours;
}

function localize(date: Date) {
  const now = new Date();
  const timezone = now.getTimezoneOffset() / 60;
  date.setHours(date.getHours() + timezone + 1);

  return date;
}

function replaceTime(text: string) {
  const timezone = containsTimezone(text);
  if (!timezone) {
    return text;
  }

  const index = text.toLowerCase().indexOf(timezone.toLowerCase());
  const postfix = text.slice(index, index + timezone.length + 3);
  if (postfix.includes("(")) {
    return text;
  }

  const prefix = text
    .toLocaleLowerCase()
    .split(timezone.toLocaleLowerCase())[0];

  const timeString = getTimeString(prefix);
  let hours = toHours(timeString);

  if (timezones[timezone]) {
    hours -= timezones[timezone];
  } else if (timezone.includes("UTC")) {
    if (timezone !== "UTC") {
      const diff = parseInt(timezone.replace("UTC", ""));
      hours -= diff;
    }
  }

  const now = new Date();
  const minutes = (hours - Math.floor(hours)) * 60;
  const date = new Date(
    Date.UTC(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      Math.floor(hours),
      minutes,
      0,
      0
    )
  );

  const localTime = localize(date);

  if (!isValidDate(localTime)) {
    return text;
  }

  const time = localTime.toLocaleTimeString().split(":").slice(0, 2).join(":");
  const replaceText = `<i>(${time})</i>`;
  const origIndex = index - timeString.length;
  const origEndIndex = index + timezone.length;

  const orig = text.slice(origIndex, origEndIndex);

  const result = text.replace(orig, orig + " " + replaceText);

  return result;
}
