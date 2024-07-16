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

        // Добавление заголовка структуры данных
        sheetData.push(['Team', 'Files', 'Links', 'Confirmed', 'CreatedAt', 'TeamMembers']);

        // Проход по каждому проекту в указанном блоке
        block.projects.forEach(project => {
          console.log(project);
          const teamName = project.team?.leader
            ? `${project.team.leader.name} (${project.team.leader.email})`
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
          sheetData.push([teamName, files, links, confirmed, createdAt, teamMembers]);
        });
      }
    });

    return sheetData;
  } catch (error) {
    console.error('Error getting data for sheet:', error);
  }
};

module.exports = getBlockProjectsByWeekData;
