export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString; // Fallback if invalid
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}-${month}-${year}`;
}

export function sortBatches(batches: string[]): string[] {
  const prefixOrder: Record<string, number> = {
    'JD': 1,
    'HS': 2,
    'BS': 3
  };

  const getScore = (batch: string) => {
    const match = batch.match(/^([A-Za-z]+)-(\d+)$/);
    if (match) {
      const prefix = match[1].toUpperCase();
      const num = parseInt(match[2], 10);
      const order = prefixOrder[prefix] ?? 99;
      return { order, num, match: true };
    }
    return { order: 100, num: 0, match: false };
  };

  return [...batches].sort((a, b) => {
    const scoreA = getScore(a);
    const scoreB = getScore(b);

    if (scoreA.match && scoreB.match) {
      if (scoreA.order !== scoreB.order) {
        return scoreA.order - scoreB.order;
      }
      return scoreA.num - scoreB.num;
    }
    
    if (scoreA.match && !scoreB.match) return -1;
    if (!scoreA.match && scoreB.match) return 1;

    return a.localeCompare(b);
  });
}
