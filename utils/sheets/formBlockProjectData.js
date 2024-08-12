const getBlockProjectsByWeekData = async (marathons, blockIndex) => {
  try {
    // Создание массива для хранения данных
    const sheetData = [];

    // Проход по каждому марафону
    marathons.forEach(marathon => {
      // Добавление строки с названием марафона
      sheetData.push([marathon.name]);

      // Проверка наличия блоков и указанного блока
      if (marathon.blocks && marathon.blocks[blockIndex]) {
        const block = marathon.blocks[blockIndex];

        const header = [];
        // Добавление заголовка структуры данных
        header.push('Team', 'Files', 'Links');

        if (block.isFinalWeek) header.push('Video link', 'Video Description', 'Mentor Comment');

        header.push('Confirmed', 'CreatedAt', 'TeamMembers');
        sheetData.push(header);
        block.projects.forEach(project => {
          console.log(project);
          const teamName = project.team?.leader
            ? `${project.team.leader.name} (${project.team.leader.email}) (${project.team.members.length})`
            : 'No Team';
          const teamMembers =
            project.team && project.team.members
              ? project.team.members.map(member => member.name).join(', ')
              : 'No Members';
          const files = project.files.join(', ');
          const links = project.links.join(', ');
          const confirmed = project.confirm ? 'Yes' : 'No';
          const createdAt = project.createdAt;

          // Формирование данных для таблицы
          const row = [];
          row.push(teamName, files, links);
          if (block.isFinalWeek) {
            const videoLink = project?.finalVideo?.link;
            const videoDesc = project?.finalVideo?.description;
            const mentorComment = project?.mentorComment?.text;
            row.push(videoLink, videoDesc, mentorComment);
          }
          row.push(confirmed, createdAt, teamMembers);
          sheetData.push(row);
        });
      }
    });

    return sheetData;
  } catch (error) {
    console.error('Error getting data for sheet:', error);
  }
};

module.exports = getBlockProjectsByWeekData;
