---
title: Java Excel 처리
updated: 2026-08-11 17:04:12
tags:
  - java
  - excel
  - poi
  - fastexcel
  - easyexcel
  - xlsx
  - streaming
---

## 1. 개요

Java에서 Excel 파일을 다루는 주요 라이브러리는 세 가지다.

| | Apache POI | FastExcel | EasyExcel |
| :--- | :--- | :--- | :--- |
| 버전 | 5.5.1 | 0.20.2 (write) / 0.18.4 (read) | 4.0.3 |
| .xls 지원 | ✅ | ✗ | ✅ |
| .xlsx 지원 | ✅ | ✅ | ✅ |
| 스트리밍 쓰기 | ✅ SXSSF | ✅ (항상) | ✅ |
| 스트리밍 읽기 | ✅ SAX (수동) | ✅ | ✅ (자동) |
| 수식 | 완전 지원 | 값 없이 셀만 작성 | 기본 지원 |
| 차트 | ✅ | ✗ | 제한적 |
| API 복잡도 | 높음 | 낮음 | 중간 |
| 유지보수 상태 | 활발 | 활발 | 유지보수 모드 (2025-09~) |

---

## 2. Apache POI

### 2.1. 의존성

```groovy
implementation 'org.apache.poi:poi:5.5.1'          // HSSF (.xls)
implementation 'org.apache.poi:poi-ooxml:5.5.1'    // XSSF / SXSSF (.xlsx)
```

### 2.2. API 계층

| 클래스 | 포맷 | 메모리 모델 |
| :--- | :--- | :--- |
| `HSSFWorkbook` | .xls | 전체 파일을 힙에 로드 |
| `XSSFWorkbook` | .xlsx | 전체 XML DOM을 힙에 로드 |
| `SXSSFWorkbook` | .xlsx 쓰기 전용 | 슬라이딩 윈도우 → 디스크 플러시 |

`Workbook` / `Sheet` / `Row` / `Cell` 인터페이스는 HSSF와 XSSF가 공유한다. 포맷에 무관한 코드는 이 인터페이스로 작성한다.

### 2.3. 읽기 — XSSF

소~중형 파일에 적합하다.

```java
try (Workbook workbook = new XSSFWorkbook(new FileInputStream("data.xlsx"))) {
    Sheet sheet = workbook.getSheetAt(0);
    for (Row row : sheet) {
        for (Cell cell : row) {
            switch (cell.getCellType()) {
                case STRING  -> System.out.print(cell.getStringCellValue());
                case NUMERIC -> System.out.print(cell.getNumericCellValue());
                case BOOLEAN -> System.out.print(cell.getBooleanCellValue());
                case FORMULA -> System.out.print(cell.getCachedFormulaResultType());
                default      -> System.out.print("");
            }
        }
        System.out.println();
    }
}
```

날짜 셀은 `NUMERIC` 타입으로 저장된다. `DateUtil.isCellDateFormatted(cell)`으로 구분한 뒤 `cell.getLocalDateTimeCellValue()`로 읽는다.

### 2.4. 쓰기 — XSSF

소~중형 파일에 적합하다.

```java
try (Workbook workbook = new XSSFWorkbook()) {
    Sheet sheet = workbook.createSheet("Sheet1");

    // 헤더
    Row header = sheet.createRow(0);
    header.createCell(0).setCellValue("이름");
    header.createCell(1).setCellValue("금액");

    // 데이터
    Row row = sheet.createRow(1);
    row.createCell(0).setCellValue("홍길동");
    row.createCell(1).setCellValue(150000.0);

    // 스타일 (숫자 포맷)
    CellStyle style = workbook.createCellStyle();
    style.setDataFormat(workbook.createDataFormat().getFormat("#,##0"));
    row.getCell(1).setCellStyle(style);

    try (FileOutputStream fos = new FileOutputStream("output.xlsx")) {
        workbook.write(fos);
    }
}
```

### 2.5. 스트리밍 쓰기 — SXSSF

대용량 파일 쓰기에 사용한다.

```java
// windowSize: 메모리에 유지할 최대 행 수. 초과 행은 임시 파일로 플러시됨
try (SXSSFWorkbook workbook = new SXSSFWorkbook(100)) {
    Sheet sheet = workbook.createSheet("Sheet1");

    for (int i = 0; i < 500_000; i++) {
        Row row = sheet.createRow(i);
        row.createCell(0).setCellValue("row-" + i);
        row.createCell(1).setCellValue(i * 1.5);
    }

    try (FileOutputStream fos = new FileOutputStream("large.xlsx")) {
        workbook.write(fos);
    }
} finally {
    workbook.dispose(); // 임시 파일 삭제 — 반드시 호출
}
```

- `windowSize = -1`: 자동 플러시 비활성화. `sheet.flushRows(keepRows)`로 수동 제어
- 플러시된 행은 재접근 불가 (쓰기 전용)
- `dispose()`를 생략하면 임시 파일(`poi-sxssf-*.xlsx`)이 누적된다

### 2.6. 스트리밍 읽기 — SAX

DOM 방식(`XSSFWorkbook`)은 대형 파일에서 OutOfMemoryError를 유발한다. SAX 이벤트 모델로 읽으면 행 단위 처리가 가능하다.

```java
OPCPackage pkg = OPCPackage.open("large.xlsx");
XSSFReader reader = new XSSFReader(pkg);
SharedStringsTable sst = (SharedStringsTable) reader.getSharedStringsTable();
XMLReader parser = XMLHelper.newXMLReader();

// SheetContentsHandler 구현
SheetHandler handler = new SheetHandler(sst);
parser.setContentHandler(new XSSFSheetXMLHandler(
    reader.getStylesTable(), sst, handler, false));

// 시트별 처리
XSSFReader.SheetIterator sheets = (XSSFReader.SheetIterator) reader.getSheetsData();
while (sheets.hasNext()) {
    try (InputStream stream = sheets.next()) {
        InputSource source = new InputSource(stream);
        parser.parse(source);
    }
}

// Handler 구현체
class SheetHandler implements XSSFSheetXMLHandler.SheetContentsHandler {
    private final SharedStringsTable sst;

    @Override
    public void startRow(int rowNum) { }

    @Override
    public void endRow(int rowNum) { System.out.println(); }

    @Override
    public void cell(String cellRef, String formattedValue, XSSFComment comment) {
        System.out.print(formattedValue + "\t");
    }
}
```

---

## 3. FastExcel

POI를 사용하지 않는 독립 라이브러리. xlsx XML을 스트리밍으로 직접 생성/파싱한다. 항상 스트리밍 방식이므로 대용량 파일에서도 메모리 사용량이 일정하다.

### 3.1. 의존성

```groovy
implementation 'org.dhatim:fastexcel:0.20.2'         // 쓰기
implementation 'org.dhatim:fastexcel-reader:0.18.4'  // 읽기
```

### 3.2. 쓰기

```java
try (OutputStream os = new FileOutputStream("output.xlsx");
     Workbook wb = new Workbook(os, "MyApp", "1.0")) {

    Worksheet ws = wb.newWorksheet("Sheet1");

    // 헤더
    ws.value(0, 0, "이름");
    ws.value(0, 1, "금액");

    // 데이터
    ws.value(1, 0, "홍길동");
    ws.value(1, 1, 150000);

    // 숫자 포맷
    ws.style(1, 1).format("#,##0").set();

    // 날짜
    ws.value(2, 0, LocalDate.now());
    ws.style(2, 0).format("yyyy-MM-dd").set();
}
```

`Workbook.close()`(또는 try-with-resources)가 호출될 때 스트림에 최종 플러시된다.

### 3.3. 읽기

```java
try (ReadableWorkbook wb = new ReadableWorkbook(new File("data.xlsx"))) {
    Sheet sheet = wb.getFirstSheet();

    try (Stream<Row> rows = sheet.openStream()) {
        rows.forEach(row -> {
            String name  = row.getCellText(0);   // 문자열
            Optional<Double> amount = row.getCell(1)
                .map(Cell::asNumber);
            System.out.println(name + " " + amount.orElse(0.0));
        });
    }
}
```

멀티시트:

```java
try (ReadableWorkbook wb = new ReadableWorkbook(file)) {
    wb.getSheets().forEach(sheet -> {
        try (Stream<Row> rows = sheet.openStream()) {
            rows.skip(1) // 헤더 스킵
                .forEach(row -> process(row));
        } catch (IOException e) { throw new UncheckedIOException(e); }
    });
}
```

### 3.4. 제한사항

- `.xls` 미지원
- 수식 셀에 계산 결과 값 없음 (셀 참조만 기록)
- 차트 미지원
- 암호화/복호화 미지원 (필요 시 POI를 별도 사용)
- 스타일 지원 범위가 POI보다 좁음 (병합 셀, 조건부 서식 등 불가)

---

## 4. Alibaba EasyExcel

POI의 SAX 레이어를 기반으로 하되, 메모리를 많이 사용하는 POI 객체 모델을 대체한 라이브러리. 어노테이션 기반 매핑으로 DTO를 바로 읽고 쓸 수 있다.

> **주의**: 2025년 9월부터 유지보수 모드. 신규 기능은 추가되지 않으며 버그픽스만 진행된다.

### 4.1. 의존성

```groovy
implementation 'com.alibaba:easyexcel:4.0.3'
```

### 4.2. DTO 정의

```java
@Data
public class SalesData {
    @ExcelProperty("상품명")           // 헤더명으로 매핑
    private String productName;

    @ExcelProperty(index = 1)          // 0-based 컬럼 인덱스로 매핑
    private Double price;

    @ExcelProperty("판매일")
    @DateTimeFormat("yyyy-MM-dd")
    private LocalDate saleDate;

    @ExcelProperty("비율")
    @NumberFormat("#.##%")
    private Double ratio;

    @ExcelIgnore                        // 매핑 제외
    private String internalCode;
}
```

`@ExcelProperty`에서 헤더명과 인덱스를 혼용하면 매핑 오류가 발생한다. 하나의 DTO 안에서 방식을 통일한다.

### 4.3. 읽기

```java
// Listener — Spring Bean으로 등록하지 말 것 (파일마다 새 인스턴스 필요)
public class SalesDataListener extends AnalysisEventListener<SalesData> {
    private static final int BATCH_SIZE = 1000;
    private final List<SalesData> buffer = new ArrayList<>();
    private final SalesService service;

    public SalesDataListener(SalesService service) {
        this.service = service;
    }

    @Override
    public void invoke(SalesData data, AnalysisContext context) {
        buffer.add(data);
        if (buffer.size() >= BATCH_SIZE) {
            service.saveAll(buffer);
            buffer.clear();
        }
    }

    @Override
    public void doAfterAllAnalysed(AnalysisContext context) {
        if (!buffer.isEmpty()) {
            service.saveAll(buffer);
        }
    }

    @Override
    public void onException(Exception exception, AnalysisContext context) {
        // 행 단위 오류 처리. throw하면 전체 중단, 무시하면 해당 행만 건너뜀
        log.error("Row {} parse error", context.readRowHolder().getRowIndex(), exception);
    }
}

// 실행
EasyExcel.read("sales.xlsx", SalesData.class, new SalesDataListener(salesService))
    .sheet(0)
    .headRowNumber(1)   // 헤더 행 수 (기본값 1)
    .doRead();
```

헤더 행 접근이 필요한 경우 `AnalysisEventListener.invokeHead()` 오버라이드:

```java
@Override
public void invokeHead(Map<Integer, ReadCellData<?>> headMap, AnalysisContext context) {
    headMap.forEach((idx, cell) -> System.out.println(idx + ": " + cell.getStringValue()));
}
```

### 4.4. 쓰기

```java
// 단순 쓰기
EasyExcel.write("output.xlsx", SalesData.class)
    .sheet("매출")
    .doWrite(dataList);

// 대용량 — 페이지 단위 스트리밍
try (ExcelWriter writer = EasyExcel.write("output.xlsx", SalesData.class).build()) {
    WriteSheet sheet = EasyExcel.writerSheet(0, "매출").build();
    for (int page = 0; page < totalPages; page++) {
        writer.write(fetchPage(page), sheet);
    }
}

// 멀티시트
try (ExcelWriter writer = EasyExcel.write("output.xlsx").build()) {
    WriteSheet sheet1 = EasyExcel.writerSheet(0, "Sheet1")
        .head(SalesData.class).build();
    WriteSheet sheet2 = EasyExcel.writerSheet(1, "Sheet2")
        .head(OtherData.class).build();
    writer.write(list1, sheet1);
    writer.write(list2, sheet2);
}
```

### 4.5. 템플릿 채우기 (Fill)

기존 xlsx 파일을 템플릿으로 사용해 값을 채운다. 보고서 양식 유지에 유용하다.

```java
// 템플릿: {name}, {amount} 플레이스홀더 사용
EasyExcel.write("output.xlsx")
    .withTemplate("template.xlsx")
    .sheet()
    .doFill(Map.of("name", "홍길동", "amount", 150000));
```

---

## 5. 라이브러리 선택 기준

| 상황 | 권장 |
| :--- | :--- |
| .xls 지원 필요 | Apache POI (HSSF) 또는 EasyExcel |
| 수식·차트 생성 필요 | Apache POI |
| 단순 대용량 데이터 쓰기 | FastExcel |
| 단순 대용량 데이터 읽기 (DTO 매핑 편의) | EasyExcel (단, 유지보수 모드 인지 후 사용) |
| 세밀한 스타일·서식 제어 | Apache POI (XSSF/SXSSF) |
| 최소 의존성 + 낮은 메모리 | FastExcel |

---

## Sources

- `raw/java/아 엑셀다운로드 개발,,, 쉽고 빠르게 하고 싶다 (feat. 엑셀 다운로드 모듈 개발기)  우아한.md`
- [Apache POI — Overview](https://poi.apache.org/)
- [Apache POI — Components](https://poi.apache.org/components/index.html)
- [Apache POI — SXSSF Streaming Usermodel API](https://poi.apache.org/components/spreadsheet/how-to.html#sxssf)
- [FastExcel GitHub — dhatim/fastexcel](https://github.com/dhatim/fastexcel)
- [EasyExcel GitHub — alibaba/easyexcel](https://github.com/alibaba/easyexcel)
- [EasyExcel 공식 문서](https://easyexcel.opensource.alibaba.com/)

---

## Related pages

- [[hikari-datasource]]
- [[mybatis]]
- [[jpa-transaction]]
- [[batch]]
