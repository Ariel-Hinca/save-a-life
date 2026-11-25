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
    private readonly LocalDocumentOcrService _localDocumentOcrService;

    public OcrController(OcrParseService ocrParseService, LocalDocumentOcrService localDocumentOcrService)
    {
        _ocrParseService = ocrParseService;
        _localDocumentOcrService = localDocumentOcrService;
    }

    /// <summary>Parse already-recognized OCR text (regex / heuristics).</summary>
    [HttpPost("scan")]
    public ActionResult<OcrScanResponse> Scan([FromBody] OcrScanRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Text))
        {
            return BadRequest(new { message = "OCR text is required." });
        }

        var result = _ocrParseService.Parse(request.Text, request.ClientConfidence);
        result.ExtractionMethod = "regex";
        return Ok(result);
    }

    /// <summary>
    /// Free local extraction: ImageMagick + Tesseract on the server.
    /// Photos are processed in-memory/temp files only — never sent to a cloud AI.
    /// </summary>
    [HttpPost("extract")]
    [RequestSizeLimit(10_000_000)]
    public async Task<ActionResult<object>> Extract(
        [FromBody] OcrExtractImageRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.ImageBase64))
        {
            return BadRequest(new { message = "ImageBase64 is required." });
        }

        if (!_localDocumentOcrService.IsAvailable())
        {
            return StatusCode(503, new
            {
                message = "Local OCR tools are not installed (tesseract / imagemagick).",
                provider = _localDocumentOcrService.ProviderName
            });
        }

        try
        {
            var (result, rawText) = await _localDocumentOcrService.ExtractFromImageAsync(
                request.ImageBase64,
                request.MimeType,
                cancellationToken);
            result.RawText = rawText;
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "Local document extraction failed." });
        }
    }

    [HttpGet("status")]
    [AllowAnonymous]
    public ActionResult<object> Status()
    {
        return Ok(new
        {
            visionConfigured = false,
            localOcrAvailable = _localDocumentOcrService.IsAvailable(),
            provider = _localDocumentOcrService.ProviderName,
            cloudAi = false,
            cost = "free"
        });
    }
}
