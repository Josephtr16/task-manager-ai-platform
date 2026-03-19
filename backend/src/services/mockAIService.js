/**
 * Mock AI Service for generating project task suggestions
 * This simulates an AI service until the real one is integrated.
 */

const analyzeProject = async (title, description = '', category = 'Work') => {
  console.log(`🤖 AI Mock Service: Analyzing project "${title}" [${category}]`);
  
  // Artificial delay to simulate AI processing
  await new Promise(resolve => setTimeout(resolve, 1500));

  const titleLower = title.toLowerCase();
  const descLower = description.toLowerCase();
  const fullText = `${titleLower} ${descLower}`;

  // 1. Determine Project Size
  let size = 'medium';
  if (fullText.includes('small') || fullText.includes('simple') || fullText.includes('quick') || fullText.includes('minimal')) {
    size = 'small';
  } else if (fullText.includes('complete') || fullText.includes('full') || fullText.includes('comprehensive') || fullText.includes('enterprise') || fullText.includes('large')) {
    size = 'large';
  }

  // 2. Determine Base Hours and Task Count based on size and category
  let baseHours, taskCount;
  const isWork = category === 'Work';

  if (size === 'small') {
    baseHours = isWork ? 15 : 10;
    taskCount = 4;
  } else if (size === 'large') {
    baseHours = isWork ? 120 : 80;
    taskCount = 10;
  } else {
    baseHours = isWork ? 40 : 25;
    taskCount = 7;
  }

  // Add some randomness
  const estimatedTotalHours = Math.round(baseHours * (0.8 + Math.random() * 0.4));
  
  // 3. Generate Suggestions based on Keywords
  let suggestions = [];
  let reasoning = '';

  if (fullText.includes('website') || fullText.includes('web')) {
    reasoning = `Based on the project title, this appears to be a web development project. I've broken it down into standard SDLC phases including design, development, and deployment.`;
    suggestions = [
      { title: 'Project requirements and wireframing', estimated_minutes: 180 },
      { title: 'UI/UX Design Mockups', estimated_minutes: 360 },
      { title: 'Database schema design and setup', estimated_minutes: 240 },
      { title: 'Backend API development', estimated_minutes: 600 },
      { title: 'Frontend component building', estimated_minutes: 720 },
      { title: 'Integration and state management', estimated_minutes: 480 },
      { title: 'User authentication and security', estimated_minutes: 300 },
      { title: 'Feature testing and bug fixing', estimated_minutes: 360 },
      { title: 'SEO optimization and performance audit', estimated_minutes: 180 },
      { title: 'Deployment to staging and production', estimated_minutes: 120 },
    ];
  } else if (fullText.includes('app') || fullText.includes('mobile')) {
    reasoning = `This mobile application project requires specific attention to mobile UI patterns and cross-platform compatibility. I've suggested tasks covering the full mobile development lifecycle.`;
    suggestions = [
      { title: 'Define app architecture and tech stack', estimated_minutes: 240 },
      { title: 'Mobile UI/UX Design (Figma)', estimated_minutes: 480 },
      { title: 'Set up development environment and boilerplate', estimated_minutes: 120 },
      { title: 'Build core navigation and layout', estimated_minutes: 300 },
      { title: 'Implement key application features', estimated_minutes: 900 },
      { title: 'API/Backend integration', estimated_minutes: 480 },
      { title: 'Device testing and responsiveness checks', estimated_minutes: 360 },
      { title: 'Push notification setup', estimated_minutes: 180 },
      { title: 'App store assets and preparation', estimated_minutes: 240 },
      { title: 'Final QA and submission', estimated_minutes: 180 },
    ];
  } else if (fullText.includes('report') || fullText.includes('document') || fullText.includes('paper')) {
    reasoning = `For a documentation or report project, I've structured tasks to follow a research-first approach followed by drafting and multiple review cycles.`;
    suggestions = [
      { title: 'Topic research and source gathering', estimated_minutes: 240 },
      { title: 'Detailed outline creation', estimated_minutes: 90 },
      { title: 'Executive summary draft', estimated_minutes: 60 },
      { title: 'Drafting main content - Section 1', estimated_minutes: 180 },
      { title: 'Drafting main content - Section 2', estimated_minutes: 180 },
      { title: 'Data visualization and charts', estimated_minutes: 120 },
      { title: 'Initial self-review and edits', estimated_minutes: 90 },
      { title: 'Peer review and feedback integration', estimated_minutes: 120 },
      { title: 'Final formatting and citations', estimated_minutes: 60 },
      { title: 'Final polish and export', estimated_minutes: 30 },
    ];
  } else if (fullText.includes('presentation') || fullText.includes('slides')) {
    reasoning = `Presentations require a balance of content preparation and visual design. These suggestions focus on narrative flow followed by slide production and practice.`;
    suggestions = [
      { title: 'Define key message and audience', estimated_minutes: 60 },
      { title: 'Storyboard and slide outline', estimated_minutes: 90 },
      { title: 'Content preparation (text and data)', estimated_minutes: 180 },
      { title: 'Select theme and visual assets', estimated_minutes: 120 },
      { title: 'Design core slides', estimated_minutes: 240 },
      { title: 'Add animations and transitions', estimated_minutes: 60 },
      { title: 'Speaker notes preparation', estimated_minutes: 90 },
      { title: 'Rehearsal and timing checks', estimated_minutes: 120 },
      { title: 'Final content review', estimated_minutes: 60 },
      { title: 'Setup and equipment check', estimated_minutes: 30 },
    ];
  } else if (fullText.includes('event') || fullText.includes('party')) {
    reasoning = `Event planning involves many logistical moving parts. I've suggested a timeline covering initial planning through to day-of execution.`;
    suggestions = [
      { title: 'Define budget and event goals', estimated_minutes: 120 },
      { title: 'Guest list compilation', estimated_minutes: 90 },
      { title: 'Venue research and booking', estimated_minutes: 240 },
      { title: 'Catering and menu selection', estimated_minutes: 180 },
      { title: 'Send invitations and track RSVPs', estimated_minutes: 60 },
      { title: 'Theme and decoration planning', estimated_minutes: 120 },
      { title: 'Equipment and AV rental', estimated_minutes: 120 },
      { title: 'Detailed schedule/runsheet creation', estimated_minutes: 90 },
      { title: 'Vendor coordination and final checks', estimated_minutes: 180 },
      { title: 'On-site setup and management', estimated_minutes: 480 },
    ];
  } else {
    reasoning = `I've analyzed your project title and description. Based on common project management patterns, I've suggested a standard workflow to ensure all phases are covered.`;
    suggestions = [
      { title: 'Initial planning and goal setting', estimated_minutes: 120 },
      { title: 'Resource gathering and research', estimated_minutes: 180 },
      { title: 'Detailed task breakdown', estimated_minutes: 60 },
      { title: 'Execution Phase 1: Foundations', estimated_minutes: 300 },
      { title: 'Execution Phase 2: Core Work', estimated_minutes: 600 },
      { title: 'Execution Phase 3: Refinement', estimated_minutes: 300 },
      { title: 'Internal review and quality check', estimated_minutes: 120 },
      { title: 'Final adjustments', estimated_minutes: 90 },
      { title: 'Project wrap-up and documentation', estimated_minutes: 120 },
      { title: 'Post-project evaluation', estimated_minutes: 60 },
    ];
  }

  // Subset suggestions based on determined taskCount
  const finalSuggestions = suggestions.slice(0, taskCount);

  return {
    is_large_task: size === 'large',
    estimated_total_hours: estimatedTotalHours,
    reasoning: reasoning,
    suggested_subtasks: finalSuggestions
  };
};

module.exports = {
  analyzeProject
};
