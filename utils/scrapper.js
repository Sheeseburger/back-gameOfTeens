// const data = require('../test2.json');
const Project = require('../models/project.model');
jureIds = ['667bdb8e6776f7e936d7f09e', '667bdb826776f7e936d7f09b', '667bdb716776f7e936d7f098'];
// criterias = [
//   '667bccf33971426c0cc2e121',
//   '667bcd093971426c0cc2e12a',
//   '667bccf83971426c0cc2e124',
//   '667bcd003971426c0cc2e127',
//   '667bccec3971426c0cc2e11e'
// ]; // for mine junior
// const criterias = [
//   '667bccf33971426c0cc2e121',
//   '667bccf83971426c0cc2e124',
//   '667bcd003971426c0cc2e127',
//   '667bccec3971426c0cc2e11e'
// ]; mine kids
const criterias = [
  '667bcce53971426c0cc2e118',
  '667bcce83971426c0cc2e11b',
  '667bccec3971426c0cc2e11e'
];
const scrapper = () => {
  console.log(data);
  let count = 0;
  // const group = data.groups[];
  data.groups.forEach((group, index) => {
    if (index === 2)
      group.students.forEach(async student => {
        if (student.courses[0].modules[0].homework.attacheFileLinks[0] != '')
          // console.log(student.fullName, group.id, group.name);
          // console.log(student.courses[0].modules[0].homework.attacheFileLinks);
          count += 1;
      });
    // const newProject = new Project({
    //   name: student.fullName,
    //   links: student.courses[0].modules[0].homework.attacheFileLinks,
    //   course: group.id, // courseId
    //   criterias: criterias,
    //   jures: jureIds.map(jureId => ({
    //     jureId: jureId,
    //     scores: criterias.map(criteriaId => ({
    //       criteria: criteriaId,
    //       score: 0 // Default score, adjust as needed
    //     }))
    //   }))
    // });
    // await newProject.save();
  });
  // const newProject = new Project({
  //   name: '!Test project',
  //   links: ['test.pdf', 'test.mp4'],
  //   course: group.id, // courseId
  //   criterias: criterias,
  //   jures: jureIds.map(jureId => ({
  //     jureId: jureId,
  //     scores: criterias.map(criteriaId => ({
  //       criteria: criteriaId,
  //       score: 0 // Default score, adjust as needed
  //     }))
  //   }))
  // }).save();

  console.log(count);
  // console.log(group.id, group.students.length);
};
// };

module.exports = scrapper;
