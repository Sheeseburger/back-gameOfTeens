const fillAllProjects = projects => {
  const headerRow1 = ['Назва', 'Курс', 'Чи є лінки', 'Лінки'];
  const rows = [headerRow1];
  projects.forEach(project => {
    // console.log(project.name, project.course.name, ...project.links);
    rows.push([project.name, project.course.name, project.links[0] !== '', ...project.links]);
  });
  return rows;
  // const criteriaSet = new Set();
  // projects.forEach(project => {
  //   project.criterias.forEach(criteria => {
  //     criteriaSet.add(criteria);
  //   });
  // });
  // criteriaSet.forEach(criteria => {
  //   // Каждый критерий занимает три колонки
  //   headerRow1.push(`${criteria.name}`, '', '', 'Average');
  //   headerRow2.push('Maxim Kucherenko', 'Diana Lonzhanska', 'Alina Maximenko', ' ');
  // });
  // headerRow1.push('Усього', 'Комментарії');
  // headerRow2.push('', 'Maxim Kucherenko', 'Diana Lonzhanska', 'Alina Maximenko');
  // const rows = [headerRow1, headerRow2];

  // projects.forEach(project => {
  //   const row = [project.name];
  //   let totalScore = 0;

  //   criteriaSet.forEach(criteriaId => {
  //     let avgScore = 0;
  //     const jureScores = project.jures.map((jure, index) => {
  //       // console.log(jure);
  //       const sc = jure.scores.find(score => {
  //         {
  //           return score.criteria._id.toString() === criteriaId._id.toString();
  //         }
  //       });
  //       avgScore += sc.score;
  //       return sc.score;
  //     });
  //     totalScore += +(avgScore / criteriaSet.size).toFixed(2);
  //     row.push(...jureScores, +(avgScore / criteriaSet.size).toFixed(2));
  //   });
  //   const comments = project.jures.map(jure => jure.comment);
  //   row.push(totalScore, ...comments);
  //   rows.push(row);
  // });

  // return rows;
};

module.exports = fillAllProjects;
