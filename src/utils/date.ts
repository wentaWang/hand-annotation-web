import dayjs from 'dayjs'

export function formatDate(timestamp) {
  if (timestamp == null || isNaN(timestamp)) return '';

  const timestampNumber = typeof timestamp === 'string' ? Number(timestamp) : timestamp;

  if (isNaN(timestampNumber)) return '';

  if (timestampNumber.toString().length === 13) {
    const date = new Date(timestampNumber);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0]; 
  }

  if (timestampNumber.toString().length === 10) {
    return dayjs(Number(timestampNumber) * 1000).format('YYYY-MM-DD'); 
  }

  return ''; // If neither, return empty string
}


export function formatDateByLong(timestamp) {
  if(!timestamp) {
    return "";
  }
 return dayjs(Number(timestamp)).format('YYYY-MM-DD')
}

export function  formatDateStr(dateString){
  if (!dateString) return '';
  
  // 直接使用 Date 对象解析
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};