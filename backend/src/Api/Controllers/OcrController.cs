using Api.DTOs;
using Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Authorize]
[Route("api/ocr")]
public class OcrController : ControllerBase
{
    private readonly OcrParseService _ocrParseService;

    public OcrController(OcrParseService ocrParseService)
    {
        _ocrParseService = ocrParseService;
    }

    [HttpPost("scan")]
    public ActionResult<OcrScanResponse> Scan([FromBody] OcrScanRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Text))
        {
            return BadRequest(new { message = "OCR text is required." });
        }

        var result = _ocrParseService.Parse(request.Text, request.ClientConfidence);
        return Ok(result);
    }
}
