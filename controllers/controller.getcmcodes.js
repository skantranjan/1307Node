const { getAllCMCodes, getCMCodeByCode } = require('../models/model.getCMCodes');

async function getAllCMCodesController(request, reply) {
  try {
    const data = await getAllCMCodes();
    reply.send({ success: true, data });
  } catch (error) {
    reply.code(500).send({ success: false, message: error.message });
  }
}

async function getCMCodeByCodeController(request, reply) {
  try {
    const { cm_code } = request.params;
    const data = await getCMCodeByCode(cm_code);
    reply.send({ success: true, data });
  } catch (error) {
    reply.code(500).send({ success: false, message: error.message });
  }
}

module.exports = { getAllCMCodesController, getCMCodeByCodeController }; 