const { insertComponentDetail } = require('../models/model.addComponent');

/**
 * Controller to add a new component detail
 */
async function addComponentController(request, reply) {
  try {
    const componentData = request.body;

  console.log(JSON.stringify(componentData));

  

    // Set default values for timestamps if not provided
    if (!componentData.created_date) {
      componentData.created_date = new Date();
    }

    if (!componentData.last_update_date) {
      componentData.last_update_date = new Date();
    }

    // Set default value for is_active if not provided
    if (componentData.is_active === undefined) {
      componentData.is_active = true;
    }

    const insertedComponent = await insertComponentDetail(componentData);

    reply.code(201).send({
      success: true,
      message: 'Component detail added successfully',
      data: insertedComponent
    });

  } catch (error) {
    request.log.error(error);
    reply.code(500).send({ 
      success: false, 
      message: 'Failed to add component detail', 
      error: error.message 
    });
  }
}

module.exports = { addComponentController }; 