// #region start: HuggingFace Spaces Docker Integration for The Steward
// Tier 2 (Local Heavy) - Unlimited specialized AI processing via HF Spaces
// Implements Docker registry integration for 50,000+ available spaces

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const crypto = require('crypto');

/**
 * HuggingFace Spaces Docker Registry Configuration
 */
const HF_REGISTRY = 'registry.hf.space';
const HF_SPACES_CONFIG_PATH = path.join(__dirname, '../../hf-spaces');
const HF_SPACES_CACHE_PATH = path.join(HF_SPACES_CONFIG_PATH, 'cache');
const HF_SPACES_REGISTRY_PATH = path.join(HF_SPACES_CONFIG_PATH, 'registry.yaml');

// Ensure directories exist
[HF_SPACES_CONFIG_PATH, HF_SPACES_CACHE_PATH].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Load HF Spaces registry from local cache
 * @returns {object} - HF Spaces registry data
 */
function loadHFSpacesRegistry() {
  try {
    if (fs.existsSync(HF_SPACES_REGISTRY_PATH)) {
      const registryData = yaml.load(fs.readFileSync(HF_SPACES_REGISTRY_PATH, 'utf8'));
      return registryData || {};
    }
  } catch (err) {
    console.warn('Warning: Could not load HF Spaces registry:', err.message);
  }
  
  // Return default registry structure
  return {
    last_updated: null,
    spaces: {},
    categories: {
      image_processing: [],
      audio_processing: [],
      text_processing: [],
      computer_vision: [],
      nlp: [],
      multimodal: [],
      specialized: []
    }
  };
}

/**
 * Save HF Spaces registry to local cache
 * @param {object} registry - Registry data to save
 */
function saveHFSpacesRegistry(registry) {
  try {
    registry.last_updated = new Date().toISOString();
    fs.writeFileSync(HF_SPACES_REGISTRY_PATH, yaml.dump(registry, { indent: 2 }));
  } catch (err) {
    console.warn('Warning: Could not save HF Spaces registry:', err.message);
  }
}

/**
 * Execute HuggingFace Space Docker container
 * @param {string} prompt - Input prompt/data
 * @param {string} spaceName - HF Space identifier
 * @param {object} options - Execution options
 * @returns {Promise<object>} - Execution result
 */
async function executeHFSpace(prompt, spaceName, options = {}) {
  const startTime = Date.now();
  const executionId = crypto.randomBytes(8).toString('hex');
  
  try {
    console.log(`🔧 Initializing HF Space: ${spaceName}`);
    
    // Step 1: Validate and prepare space
    const spaceInfo = await validateHFSpace(spaceName);
    if (!spaceInfo.valid) {
      throw new Error(`Invalid HF Space: ${spaceInfo.reason}`);
    }
    
    // Step 2: Prepare Docker execution environment
    const dockerConfig = await prepareDockerEnvironment(spaceName, executionId, options);
    
    // Step 3: Execute Docker container
    const result = await runDockerContainer(dockerConfig, prompt, options);
    
    // Step 4: Process and validate results
    const processedResult = await processHFSpaceResult(result, spaceInfo, options);
    
    const executionTime = Date.now() - startTime;
    
    return {
      success: true,
      space: spaceName,
      result: processedResult,
      execution_time: executionTime,
      execution_id: executionId,
      tier: 'tier2-heavy',
      cost: 0, // Always free for local HF Spaces
      metadata: {
        space_info: spaceInfo,
        docker_config: dockerConfig
      }
    };
    
  } catch (err) {
    const executionTime = Date.now() - startTime;
    
    return {
      success: false,
      space: spaceName,
      error: err.message,
      execution_time: executionTime,
      execution_id: executionId,
      tier: 'tier2-heavy'
    };
  }
}

/**
 * Validate HuggingFace Space availability and configuration
 * @param {string} spaceName - HF Space identifier
 * @returns {Promise<object>} - Validation result
 */
async function validateHFSpace(spaceName) {
  // Check if space is in local registry
  const registry = loadHFSpacesRegistry();
  const spaceInfo = registry.spaces[spaceName];
  
  if (spaceInfo) {
    return {
      valid: true,
      cached: true,
      info: spaceInfo
    };
  }
  
  // Attempt to discover space dynamically
  try {
    const discoveredSpace = await discoverHFSpace(spaceName);
    if (discoveredSpace) {
      // Add to registry cache
      registry.spaces[spaceName] = discoveredSpace;
      saveHFSpacesRegistry(registry);
      
      return {
        valid: true,
        cached: false,
        info: discoveredSpace
      };
    }
  } catch (err) {
    console.warn(`Warning: Could not discover HF Space ${spaceName}:`, err.message);
  }
  
  return {
    valid: false,
    reason: `HF Space '${spaceName}' not found or not accessible`
  };
}

/**
 * Discover HuggingFace Space configuration dynamically
 * @param {string} spaceName - HF Space identifier
 * @returns {Promise<object>} - Space configuration
 */
async function discoverHFSpace(spaceName) {
  // Parse space name (format: username/spacename or username-spacename)
  const spaceId = spaceName.includes('/') ? spaceName.replace('/', '-') : spaceName;
  const dockerImage = `${HF_REGISTRY}/${spaceId}:latest`;
  
  // Try to pull image to check availability
  try {
    await execDockerCommand(`docker pull ${dockerImage}`);
    
    // Basic space configuration (would be enhanced with actual HF API integration)
    const spaceConfig = {
      id: spaceName,
      docker_image: dockerImage,
      description: `HuggingFace Space: ${spaceName}`,
      category: inferSpaceCategory(spaceName),
      input_type: 'text',
      output_type: 'text',
      port: 7860,
      discovered_at: new Date().toISOString(),
      status: 'available'
    };
    
    return spaceConfig;
    
  } catch (err) {
    throw new Error(`Could not pull Docker image for ${spaceName}: ${err.message}`);
  }
}

/**
 * Infer space category from name and description
 * @param {string} spaceName - HF Space identifier
 * @returns {string} - Inferred category
 */
function inferSpaceCategory(spaceName) {
  const lowerName = spaceName.toLowerCase();
  
  if (lowerName.includes('image') || lowerName.includes('vision') || lowerName.includes('clip')) {
    return 'image_processing';
  }
  if (lowerName.includes('audio') || lowerName.includes('whisper') || lowerName.includes('speech')) {
    return 'audio_processing';
  }
  if (lowerName.includes('text') || lowerName.includes('nlp') || lowerName.includes('sentiment')) {
    return 'text_processing';
  }
  if (lowerName.includes('chat') || lowerName.includes('conversation')) {
    return 'nlp';
  }
  if (lowerName.includes('multi') || lowerName.includes('mm')) {
    return 'multimodal';
  }
  
  return 'specialized';
}

/**
 * Prepare Docker execution environment for HF Space
 * @param {string} spaceName - HF Space identifier
 * @param {string} executionId - Unique execution identifier
 * @param {object} options - Execution options
 * @returns {Promise<object>} - Docker configuration
 */
async function prepareDockerEnvironment(spaceName, executionId, options) {
  const registry = loadHFSpacesRegistry();
  const spaceInfo = registry.spaces[spaceName];
  
  if (!spaceInfo) {
    throw new Error(`Space ${spaceName} not found in registry`);
  }
  
  const containerName = `hf-space-${spaceName.replace(/[^a-zA-Z0-9-]/g, '-')}-${executionId}`;
  const port = options.port || spaceInfo.port || 7860;
  const hostPort = await findAvailablePort(port);
  
  // Prepare input/output directories
  const workDir = path.join(HF_SPACES_CACHE_PATH, executionId);
  const inputDir = path.join(workDir, 'input');
  const outputDir = path.join(workDir, 'output');
  
  [workDir, inputDir, outputDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  return {
    container_name: containerName,
    docker_image: spaceInfo.docker_image,
    host_port: hostPort,
    container_port: port,
    work_dir: workDir,
    input_dir: inputDir,
    output_dir: outputDir,
    space_info: spaceInfo,
    timeout: options.timeout || 300000 // 5 minutes default
  };
}

/**
 * Find available port for Docker container
 * @param {number} preferredPort - Preferred port number
 * @returns {Promise<number>} - Available port
 */
async function findAvailablePort(preferredPort) {
  const net = require('net');
  
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(preferredPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    
    server.on('error', () => {
      // Port taken, try next available
      resolve(findAvailablePort(preferredPort + 1));
    });
  });
}

/**
 * Run Docker container for HF Space execution
 * @param {object} dockerConfig - Docker configuration
 * @param {string} prompt - Input prompt/data
 * @param {object} options - Execution options
 * @returns {Promise<object>} - Execution result
 */
async function runDockerContainer(dockerConfig, prompt, options) {
  const {
    container_name,
    docker_image,
    host_port,
    container_port,
    input_dir,
    output_dir,
    timeout
  } = dockerConfig;
  
  // Write input data
  const inputFile = path.join(input_dir, 'input.txt');
  fs.writeFileSync(inputFile, prompt);
  
  // Build Docker command
  const dockerCmd = [
    'docker', 'run',
    '--name', container_name,
    '--rm', // Remove container after execution
    '-p', `${host_port}:${container_port}`,
    '-v', `${input_dir}:/app/input`,
    '-v', `${output_dir}:/app/output`,
    docker_image
  ];
  
  console.log(`🐳 Starting Docker container: ${container_name}`);
  console.log(`📡 Port mapping: ${host_port} -> ${container_port}`);
  
  try {
    // Start container
    const containerProcess = spawn(dockerCmd[0], dockerCmd.slice(1), {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    containerProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    containerProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    // Set execution timeout
    const timeoutId = setTimeout(() => {
      containerProcess.kill('SIGTERM');
    }, timeout);
    
    // Wait for container completion
    const exitCode = await new Promise((resolve, reject) => {
      containerProcess.on('close', (code) => {
        clearTimeout(timeoutId);
        resolve(code);
      });
      
      containerProcess.on('error', (err) => {
        clearTimeout(timeoutId);
        reject(err);
      });
    });
    
    console.log(`🏁 Container finished with exit code: ${exitCode}`);
    
    // Read output
    const outputFile = path.join(output_dir, 'output.txt');
    let output = '';
    
    if (fs.existsSync(outputFile)) {
      output = fs.readFileSync(outputFile, 'utf8');
    } else if (stdout.trim()) {
      output = stdout.trim();
    }
    
    if (exitCode !== 0) {
      throw new Error(`Container execution failed (exit code ${exitCode}): ${stderr}`);
    }
    
    return {
      success: true,
      output,
      stdout,
      stderr,
      exit_code: exitCode
    };
    
  } catch (err) {
    // Cleanup on error
    try {
      await execDockerCommand(`docker stop ${container_name}`);
    } catch (cleanupErr) {
      // Ignore cleanup errors
    }
    
    throw new Error(`Docker execution failed: ${err.message}`);
  }
}

/**
 * Process HF Space execution result
 * @param {object} result - Raw execution result
 * @param {object} spaceInfo - Space configuration
 * @param {object} options - Processing options
 * @returns {Promise<object>} - Processed result
 */
async function processHFSpaceResult(result, spaceInfo, options) {
  if (!result.success) {
    throw new Error('HF Space execution failed');
  }
  
  let processedOutput = result.output;
  
  // Apply space-specific output processing
  switch (spaceInfo.info.category) {
    case 'image_processing':
      processedOutput = await processImageResult(result.output, options);
      break;
      
    case 'audio_processing':
      processedOutput = await processAudioResult(result.output, options);
      break;
      
    case 'text_processing':
    case 'nlp':
      processedOutput = processTextResult(result.output, options);
      break;
      
    default:
      processedOutput = result.output;
  }
  
  return {
    content: processedOutput,
    raw_output: result.output,
    category: spaceInfo.info.category,
    processing_info: {
      space_id: spaceInfo.info.id,
      output_type: spaceInfo.info.output_type,
      processed_at: new Date().toISOString()
    }
  };
}

/**
 * Process image processing results
 * @param {string} output - Raw output
 * @param {object} options - Processing options
 * @returns {Promise<string>} - Processed output
 */
async function processImageResult(output, options) {
  // Handle image processing output (paths, base64, etc.)
  if (output.includes('base64')) {
    return `[Image Result] ${output.substring(0, 100)}...`;
  }
  
  if (output.includes('/app/output/')) {
    return `[Image Generated] Result saved to output directory\n${output}`;
  }
  
  return output;
}

/**
 * Process audio processing results
 * @param {string} output - Raw output
 * @param {object} options - Processing options
 * @returns {Promise<string>} - Processed output
 */
async function processAudioResult(output, options) {
  // Handle audio processing output (transcriptions, audio files, etc.)
  if (output.includes('transcript')) {
    return `[Audio Transcription]\n${output}`;
  }
  
  return output;
}

/**
 * Process text processing results
 * @param {string} output - Raw output
 * @param {object} options - Processing options
 * @returns {string} - Processed output
 */
function processTextResult(output, options) {
  // Clean up common text processing artifacts
  return output.replace(/\n\n+/g, '\n\n').trim();
}

/**
 * Execute Docker command with promise wrapper
 * @param {string} command - Docker command to execute
 * @returns {Promise<string>} - Command output
 */
function execDockerCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Command failed: ${error.message}\nStderr: ${stderr}`));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

/**
 * Discover available HF Spaces by category
 * @param {string} category - Space category to search
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array>} - Available spaces
 */
async function discoverSpacesByCategory(category, limit = 10) {
  const registry = loadHFSpacesRegistry();
  const categorySpaces = registry.categories[category] || [];
  
  // Return cached spaces for now
  // In production, this would query the actual HF API
  return categorySpaces.slice(0, limit).map(spaceId => ({
    id: spaceId,
    info: registry.spaces[spaceId] || { description: `HuggingFace Space: ${spaceId}` }
  }));
}

/**
 * Get recommended HF Spaces for a specific task
 * @param {string} taskType - Type of task
 * @param {string} taskDescription - Detailed task description
 * @returns {Array} - Recommended spaces
 */
function getRecommendedSpaces(taskType, taskDescription = '') {
  const recommendations = {
    'image_processing': [
      { id: 'clip-analysis', description: 'CLIP-based image analysis and similarity' },
      { id: 'stable-diffusion', description: 'Text-to-image generation' },
      { id: 'image-captioning', description: 'Generate captions for images' }
    ],
    'audio_processing': [
      { id: 'whisper-transcription', description: 'Speech-to-text transcription' },
      { id: 'audio-classification', description: 'Audio content classification' },
      { id: 'voice-cloning', description: 'Voice synthesis and cloning' }
    ],
    'text_processing': [
      { id: 'sentiment-analysis', description: 'Analyze text sentiment' },
      { id: 'text-summarization', description: 'Summarize long texts' },
      { id: 'translation', description: 'Multi-language translation' }
    ],
    'specialized': [
      { id: 'code-generation', description: 'Generate code from descriptions' },
      { id: 'document-qa', description: 'Question answering on documents' },
      { id: 'multimodal-chat', description: 'Chat with images and text' }
    ]
  };
  
  return recommendations[taskType] || recommendations['specialized'];
}

/**
 * Cleanup old HF Spaces cache files
 * @param {number} maxAge - Maximum age in milliseconds
 */
function cleanupHFSpacesCache(maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
  try {
    const files = fs.readdirSync(HF_SPACES_CACHE_PATH);
    const now = Date.now();
    
    files.forEach(file => {
      const filePath = path.join(HF_SPACES_CACHE_PATH, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        fs.rmSync(filePath, { recursive: true, force: true });
        console.log(`🧹 Cleaned up old HF Spaces cache: ${file}`);
      }
    });
  } catch (err) {
    console.warn('Warning: Could not cleanup HF Spaces cache:', err.message);
  }
}

// Export all functions
module.exports = {
  executeHFSpace,
  validateHFSpace,
  discoverHFSpace,
  discoverSpacesByCategory,
  getRecommendedSpaces,
  loadHFSpacesRegistry,
  saveHFSpacesRegistry,
  cleanupHFSpacesCache,
  // Configuration
  HF_REGISTRY,
  HF_SPACES_CONFIG_PATH,
  HF_SPACES_CACHE_PATH
};

// #endregion end: HuggingFace Spaces Docker Integration