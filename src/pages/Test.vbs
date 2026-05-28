If DbAccess.LabelNo.TestConnection() Or DbAccess.Local_DB.TestConnection() Then

    Arc0.IsShow = True
    ' Progress bar loop
    For i = 0 To 1000
        Var.SystemVars.Footer_Progbar_On = True
        Var.SystemVars.Footer_Progbar = i * 2
    Next
    
    '####################################################################################################################################################################################
    ' ADDITIONAL CHECK: If ItemNo is empty, retry fetching it with fresh authentication
    '####################################################################################################################################################################################
    
    If Var.BCVars.ItemNo = "" Then
        DIVCmd.System.LogMsg "ItemNo is empty, attempting to retry fetch with fresh authentication..."

        ' Get fresh OAuth token
        Dim retryTokenUrl, retryTokenRequest, retryTokenResponse, retryAccessToken, retryRequestBody
        retryTokenUrl = "https://login.microsoftonline.com/" & tenantId & "/oauth2/v2.0/token"

        DIVCmd.System.LogMsg "Retry: Getting fresh authentication token..."
        Set retryTokenRequest = CreateObject("MSXML2.ServerXMLHTTP.6.0")
        retryTokenRequest.Open "POST", retryTokenUrl, False
        retryTokenRequest.setRequestHeader "Content-Type", "application/x-www-form-urlencoded"

        retryRequestBody = "client_id=" & clientId & _
            "&scope=https://api.businesscentral.dynamics.com/.default" & _
            "&client_secret=" & clientSecret & _
            "&grant_type=client_credentials"

        On Error Resume Next
        retryTokenRequest.Send retryRequestBody
        If Err.Number <> 0 Then
            DIVCmd.System.LogMsg "Retry: Token request failed: " & Err.Description
            ' Don't show message box, just log it
            Err.Clear
        ElseIf retryTokenRequest.Status = 200 Then
            ' Parse token response
            Dim retryJsonParser
            Set retryJsonParser = New vbsJson
            Set retryTokenResponse = retryJsonParser.Decode(retryTokenRequest.responseText)
            retryAccessToken = retryTokenResponse("access_token")
            DIVCmd.System.LogMsg "Retry: Fresh authentication token obtained successfully"
        Else
            DIVCmd.System.LogMsg "Retry: Token request failed with status: " & retryTokenRequest.Status
        End If
        On Error GoTo 0

        ' If we got a fresh token, proceed with the API call
        If retryAccessToken <> "" Then
            ' Retry fetching ItemNo using GetProdOrdersV2 with fresh token
            Dim retryApiUrl, retryRequest, retryJson, retryRecord

            ' Construct the URL for retry
            Dim safeProductionRetry
            safeProductionRetry = Replace(Var.BCVars.Production, "'", "''")
            retryApiUrl = "https://api.businesscentral.dynamics.com/v2.0/14fab7d1-29d6-4d0b-941c-825a0258bdec/Production/ODataV4/Company('Copalcor%20%28Pty%29%20Ltd')/GetProdOrdersV2?" & _
                "$filter=ProdOrderNo eq '" & safeProductionRetry & "'&$select=ItemNo"

            DIVCmd.System.LogMsg "Retry API URL: " & retryApiUrl

            On Error Resume Next
            Set retryRequest = CreateObject("MSXML2.ServerXMLHTTP.6.0")
            retryRequest.Open "GET", retryApiUrl, False
            retryRequest.setRequestHeader "Authorization", "Bearer " & retryAccessToken
            retryRequest.setRequestHeader "Content-Type", "application/json"
            retryRequest.setTimeouts 30000, 30000, 30000, 30000

            retryRequest.Send

            If Err.Number <> 0 Then
                DIVCmd.System.LogMsg "Retry API request failed: " & Err.Description
            ElseIf retryRequest.Status = 200 Then
                ' Parse the response
                Set retryJson = New vbsJson
                Dim retryResponseObj
                Set retryResponseObj = retryJson.Decode(retryRequest.responseText)

                If Not retryResponseObj Is Nothing Then
                    If retryResponseObj.Exists("value") Then
                        Dim retryRecords

                        If IsArray(retryResponseObj("value")) Then
                            retryRecords = retryResponseObj("value")

                            If UBound(retryRecords) >= 0 Then
                                Set retryRecord = retryRecords(0)

                                ' Try to get ItemNo
                                If retryRecord.Exists("ItemNo") Then
                                    If Not IsNull(retryRecord("ItemNo")) And retryRecord("ItemNo") <> "" Then
                                        Var.BCVars.ItemNo = retryRecord("ItemNo")
                                        DIVCmd.System.LogMsg "SUCCESS: ItemNo retrieved on retry: " & Var.BCVars.ItemNo
                                    Else
                                        DIVCmd.System.LogMsg "Retry: ItemNo is empty or Null"
                                    End If
                                Else
                                    DIVCmd.System.LogMsg "Retry: ItemNo field not found in response"
                                End If
                            Else
                                DIVCmd.System.LogMsg "Retry: No records found in value array"
                            End If
                        Else
                            DIVCmd.System.LogMsg "Retry: value is not an array"
                        End If
                    Else
                        DIVCmd.System.LogMsg "Retry: No 'value' field in response"
                    End If
                Else
                    DIVCmd.System.LogMsg "Retry: Failed to parse JSON response"
                End If
            Else
                DIVCmd.System.LogMsg "Retry API call failed with status: " & retryRequest.Status & " - " & Left(retryRequest.responseText, 200)
            End If

            ' Clear any errors
            Err.Clear
            On Error GoTo 0
        Else
            DIVCmd.System.LogMsg "Retry: Could not obtain authentication token"
        End If

        ' After retry, check if ItemNo is still empty and show alert if needed
        If Var.BCVars.ItemNo = "" Then
            DIVCmd.System.LogMsg "ItemNo still not found after retry"
            MsgBox "Warning: Item Number (ItemNo) could not be retrieved for Production Order: " & Var.BCVars.Production & vbCrLf & _
                "This may affect label printing. Please verify the production order in Business Central.", _
                vbExclamation, "Item Number Not Found"
        Else
            DIVCmd.System.LogMsg "ItemNo successfully retrieved on retry: " & Var.BCVars.ItemNo
            ' No message popup on success
        End If
    Else
        DIVCmd.System.LogMsg "ItemNo already has value: " & Var.BCVars.ItemNo & " - no retry needed"
    End If
    
    ' Update form fields
    txtCustomer.Text = Var.BCVars.Customer
    txtCustRef.Text = Var.BCVars.Cust_Ref
    txtDate.Text = FormatDateTime(Date(), vbShortDate)
    txtGross.Text = Var.CopLabelVars.Gross
    txtItem.Text = Var.BCVars.ItemNo & " - " & Var.BCVars.Items
    'txtLabelNo.Text = Var.CopLabelVars.Label_No
    txtNett.Text = Var.CopLabelVars.Nett
    txtNumberOfcases.Text = Var.CopLabelVars.Number_Of_Cases
    txtnumberOfUnits.Text = Var.CopLabelVars.Number_Of_Units
    'txtOS.Text = Var.CopLabelVars.OS
    txtProduction.Text = Var.BCVars.Production
    txtSalesID.Text = Var.BCVars.SalesID
    txtSize.Text = Var.BCVars.Size
    txtTareMass.Text = Var.CopLabelVars.Tare_Mass
    txtcert.Text = Var.BCVars.Certificate_No
    'UniBarcode.Text = Var.CopLabelVars.Label_No
    
    txtLabelno.Text = Var.CopLabelVars.Label_No
    Var.CopLabelVars.CopalcorNr = Year(Now()) & "/" & Right("0" & Month(Now()), 2) & "/" & Right("0" & Day(Now()), 2) & "/" & Right("0" & Hour(Now()), 2) & ":" & Right("0" & Minute(Now()), 2) & ":" & Right("0" & Second(Now()), 2)
    
    'txtItemNo.text = Var.BCVars.ItemNo
    txtLotNo.text = Var.BCVars.Cast_No
    
    ' QRCode
    
    ' ==================== PREPARE QR PAYLOAD ====================
    
    jsonObj = DIVCmd.Converter.ConvertJsonToObject("{""CopalcorNr"":"""",""ItemNo"":"""",""LotNo"":"""",""SerialNo"":"""",""PackageNo"":"""",""GrossWeight"":0.0,""NettWeight"":0.0,""Location"":"""",""BinNo"":""""}")
    
    jsonObj.CopalcorNr.value = Var.CopLabelVars.CopalcorNr
    jsonObj.ItemNo.value = Var.BCVars.ItemNo
    jsonObj.LotNo.value = Var.BCVars.Cast_No
    jsonObj.SerialNo.value = Var.BCVars.SerialNo
    jsonObj.PackageNo.value = Var.CopLabelVars.Label_No
    jsonObj.GrossWeight.value = Var.CopLabelVars.Gross
    jsonObj.NettWeight.value = Var.CopLabelVars.Nett
    jsonObj.Location.value = Var.SystemVars.Location
    jsonObj.BinNo.value = Var.BCVars.BinCode
    
    payload = DIVCmd.Converter.ConvertObjectToJson(jsonObj)
    
    ' Log only first 150 characters to avoid huge logs
    DIVCmd.System.LogMsg "QR Payload ready: " & payload
    
    ' ==================== GENERATE QR USING POWERSHELL ONLY ====================
    
    Set fso = CreateObject("Scripting.FileSystemObject")
    Set shell = CreateObject("WScript.Shell")
    
    qrFolder = "C:\QRGenerator"
    tempFile = qrFolder & "\qr_payload.tmp"
    psScript = qrFolder & "\GenerateQR.ps1"
    
    ' Create folder if missing
    If Not fso.FolderExists(qrFolder) Then
        fso.CreateFolder qrFolder
    End If
    
    ' Write payload safely to temp file
    
    Set ts = fso.CreateTextFile(tempFile, True, True)
    ts.Write payload
    ts.Close
    
    ' Run PowerShell
    
    cmd = "powershell.exe -ExecutionPolicy Bypass -NoProfile -File """ & psScript & """ -PayloadFile """ & tempFile & """"
    
    DIVCmd.System.LogMsg "Calling PowerShell to generate QR code..."
    
    ret = shell.Run(cmd, 0, True)
    ' ==================== GENERATE QR USING POWERSHELL ====================
    
    Set fso = CreateObject("Scripting.FileSystemObject")
    Set shell = CreateObject("WScript.Shell")
    
    qrFolder = "C:\QRGenerator"
    tempFile = qrFolder & "\qr_payload.tmp"
    psScript = qrFolder & "\GenerateQR.ps1"
    
    ' Create folder if missing
    If Not fso.FolderExists(qrFolder) Then
        fso.CreateFolder qrFolder
    End If
    
    ' Write payload
    
    Set ts = fso.CreateTextFile(tempFile, True, True)
    ts.Write payload
    ts.Close
    
    DIVCmd.System.LogMsg "Calling PowerShell to generate QR code..."
    
    ret = shell.Run(cmd, 0, True)
    If ret = 0 Then
        DIVCmd.System.LogMsg "QR generated by PowerShell successfully"

        'WScript.Sleep 1000  
        Sleep(1000)

        ' Multiple load attempts directly on the control
        
        For attempt = 1 To 5
            loadError = QRCode.SetImagePath(Var.LabelVars.QRCode)

            If loadError = 0 Then
                DIVCmd.System.LogMsg "QR loaded successfully on attempt " & attempt & " | Path: " & Var.LabelVars.QRCode
                Exit For
            Else
                DIVCmd.System.LogMsg "Load attempt " & attempt & " failed (error " & loadError & ") | Path: " & Var.LabelVars.QRCode
                ' WScript.Sleep 500
                Sleep(500)
            End If
        Next

        If loadError <> 0 Then
            DIVCmd.System.LogMsg "All QR load attempts failed - keeping default image"

        End If

    Else
        DIVCmd.System.LogMsg "PowerShell QR generation FAILED (return code: " & ret & ")"

    End If
    
    ' Cleanup temp file
    If fso.FileExists(tempFile) Then fso.DeleteFile tempFile

    ' Load JSON parser library
    Dim oFSO, jsonFile, jsonContent
    Set oFSO = CreateObject("Scripting.FileSystemObject")
    jsonFile = "C:\Scripts\JSONFormat.vbs"

    On Error Resume Next
    If oFSO.FileExists(jsonFile) Then
        Set jsonContent = oFSO.OpenTextFile(jsonFile)
        ExecuteGlobal jsonContent.ReadAll()
        jsonContent.Close
    Else
        MsgBox "JSON library not found at: " & jsonFile, vbCritical, "Error"
        Exit Sub
    End If
    On Error GoTo 0
    
    ' API Configuration
    Dim clientId, clientSecret, tenantId, companyName, environment
    clientId = Var.API.clientId
    clientSecret = Var.API.clientSecret
    tenantId = Var.API.tenantId
    companyName = Var.API.companyName
    environment = Var.API.environment
    companyId = Var.API.companyId
    castNo = Var.BcVars.Cast_No
    productionNo = Var.BcVars.Production

    
    patchUrl = "https://api.businesscentral.dynamics.com/v2.0/" & tenantId & "/" & environment & _
        "/api/iplan/manufacturing/v1.0/companies(" & companyId & ")/PostProdOrderLotPerLocation(%27" & _
        productionNo & "%27,%27" & castNo & "%27)"
    
    ' Create JSON payload
    Dim payload
    Set payload = CreateObject("Scripting.Dictionary")
    
    ' Add mandatory fields
    payload.Add "LabelNo", Var.CopLabelVars.Label_No

    Set jsonConverter = New vbsJson
    patchData = jsonConverter.Encode(payload)
    
    DIVCmd.System.LogMsg "Preparing to patch data to API: " & patchUrl
    DIVCmd.System.LogMsg "Payload: " & patchData
    
    ' --- GET OAUTH TOKEN ---
    Dim tokenUrl, tokenRequest, tokenResponse, requestBody
    tokenUrl = "https://login.microsoftonline.com/" & tenantId & "/oauth2/v2.0/token"
    
    DIVCmd.System.LogMsg "Starting authentication for tenant: " & tenantId
    Set tokenRequest = CreateObject("MSXML2.ServerXMLHTTP.6.0")
    tokenRequest.Open "POST", tokenUrl, False
    tokenRequest.setRequestHeader "Content-Type", "application/x-www-form-urlencoded"
    tokenRequest.setRequestHeader "Accept", "application/json"
    tokenRequest.setTimeouts 30000, 30000, 30000, 30000
    
    requestBody = "client_id=" & clientId & _
        "&scope=https://api.businesscentral.dynamics.com/.default" & _
        "&client_secret=" & clientSecret & _
        "&grant_type=client_credentials"
    
    On Error Resume Next
    tokenRequest.Send requestBody
    If Err Or tokenRequest.Status <> 200 Then
        Dim tokenErrorMsg
        tokenErrorMsg = "Token request failed: " & Err.Description & " | Status: " & tokenRequest.Status & _
            " | Response: " & Left(tokenRequest.responseText, 500)
        DIVCmd.System.LogMsg tokenErrorMsg
        MsgBox tokenErrorMsg, vbCritical, "Authentication Error"
        Var.SystemVars.Footer_Progbar_On = False
        Arc.IsShow = False
        Exit Sub
    End If
    On Error GoTo 0
    
    Set tokenResponse = jsonConverter.Decode(tokenRequest.responseText)
    accessToken = tokenResponse("access_token")
    
    ' Make the PATCH request
    Set patchRequest = CreateObject("MSXML2.ServerXMLHTTP.6.0")
    patchRequest.Open "PATCH", patchUrl, False
    patchRequest.setRequestHeader "Authorization", "Bearer " & accessToken
    patchRequest.setRequestHeader "Content-Type", "application/json"
    patchRequest.setRequestHeader "Accept", "application/json"
    patchRequest.setRequestHeader "If-Match", "*"
    
    On Error Resume Next
    patchRequest.Send patchData
    If Err Then
        DIVCmd.System.LogMsg "PATCH request failed: " & Err.Description
        MsgBox "Failed to send data to Business Central", vbCritical, "API Error"
        Exit Sub
    End If
    
    DIVCmd.System.LogMsg "API Response Status: " & patchRequest.Status
    DIVCmd.System.LogMsg "API Response: " & patchRequest.responseText
    
    ' Handle response
    Select Case patchRequest.Status
        Case 200, 201 ' Success
            Dim successResponse
            Set successResponse = jsonConverter.Decode(patchRequest.responseText)

            ' --- UPDATE DATABASE ---
            sql = "UPDATE [Selling_Scales].[dbo].[DIV_SC_PTA] " & _
                "SET colt_Certificate_No = '" & Replace(Var.BCVars.Certificate_No, "'", "''") & "', " & _
                "cold_PrintLabel = 1 " & _
                "WHERE colt_Production = '" & Replace(Var.BCVars.Production, "'", "''") & "' " & _
                "AND colt_Label_No = '" & Replace(Var.CopLabelVars.Label_No, "'", "''") & "'"

            DbAccess.PTA.ExecuteNonQuery(sql)

            If Var.BCVars.ItemNo = "" Or IsNull(Var.BCVars.ItemNo) Then
                TextBox1.Text = Printer.Create_Parameters(True)
            Else
                TextBox1.Text = Printer.Create_Parameters(False)
            End If

            'patchLbl.Print()
            TextBox1.Text = Printer.Create_Parameters(False)
            Var.Printer_Vars.Parameter = Trim(TextBox1.Text)
            Var.Printer_Vars.Template = Trim(TextBox0.Text)
            Var.Printer_Vars.Print = Not Var.Printer_Vars.Print

        Case Else ' Error
            Dim errorMsg, errorResponse
            errorMsg = "Failed to save data to Business Central." & vbCrLf & _
                "Status: " & patchRequest.Status & vbCrLf & _
                "Please Weigh Again."


            On Error Resume Next
            Set errorResponse = jsonConverter.Decode(patchRequest.responseText)
            If Not Err And errorResponse.Exists("error") Then
                errorMsg = errorMsg & vbCrLf & "Error: " & errorResponse("error")("message")
            End If
            On Error GoTo 0

            MsgBox errorMsg, vbExclamation, "API Error"
            HMICmd.CloseDialogWindow()
    End Select
    
    ' Final cleanup (runs in all scenarios)
    HMICmd.CloseDialogWindow()
    Arc0.IsShow = False
    Var.SystemVars.Footer_Progbar = 100
    Var.SystemVars.Footer_Progbar_On = False
    
Else
    MsgBox "NO DATABASE CONNECTION LABEL CANNOT PRINT"
    DIVCmd.System.LogMsg("NO DATABASE CONNECTION LABEL CANNOT PRINT")
    Exit Sub
End If