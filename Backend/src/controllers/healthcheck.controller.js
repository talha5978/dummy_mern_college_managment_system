import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const healthcheck = asyncHandler(async (req, res) => {
  try {
    return res
      .status(200)
      .json(new ApiResponse(200, "Everything is OK"))
  } catch (error) {
    if (error instanceof ApiError) {
      return res
        .status(error.statusCode)
        .json(new ApiResponse(error.statusCode, error.message, error.errors))
    } else {
      return res
        .status(500)
        .json(new ApiResponse(500, "Internal Server Error", { message: error.message }))
    }
  }
})

export { healthcheck }