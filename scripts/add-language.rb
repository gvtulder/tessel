require "xcodeproj"
require "fileutils"

puts "i18n language code? (example: de)"
lang_i18n = gets.strip
puts "iOS app language code? (example: de)"
lang = gets.strip
puts "iOS meta language code? (example: de-DE)"
$lang_meta_ios = gets.strip
puts "Android meta language code? (example: de-DE)"
$lang_meta_android = gets.strip


####
# Add language to lingui.config.js
####
js = File.read("lingui.config.js")
js.sub!(/(?<=locales: \[)([^\]]+)(?=\])/) do |m|
  languages = m.scan(/"[^"]+"/)
  languages << "\"#{lang_i18n}\""
  languages.sort!
  languages.join(", ")
end
File.open("lingui.config.js", "w") do |f|
  f << js
end


system("vim src/i18n.ts")
system("vim scripts/make-screenshots.ts")


####
# Add language to Xcode project
####
project_path = "ios/App/App.xcodeproj"
project = Xcodeproj::Project.open(project_path)
FileUtils.mkdir_p("ios/App/App/#{lang}.lproj")
File.open("ios/App/App/#{lang}.lproj/LaunchScreen.strings", "w") do |f|
  f.puts
end

variant_group = project["App"]["LaunchScreen.storyboard"]

fileref = variant_group.new_file("#{lang}.lproj/LaunchScreen.strings")
fileref.last_known_file_type = "text.plist.strings"
fileref.name = "#{lang}"
fileref.include_in_index = nil

variant_group.sort

project.root_object.known_regions << lang
project.root_object.known_regions.sort!

project.save


####
# Sort the file references to have the languages on top
####
lines = File.readlines("#{project_path}/project.pbxproj")

blocks = {
  :start => [],
  :references => [],
  :end => [],
}
lines.each do |line|
  if line =~ /isa = PBXFileReference/
    blocks[:references] << line
  elsif blocks[:references].empty?
    blocks[:start] << line
  else
    blocks[:end] << line
  end
end

blocks[:references].sort_by! do |line|
  line[/(\s[-a-zA-Z]+)\.lproj\/LaunchScreen\.strings/, 1] or line[/^\s+([A-Z0-9]+)/, 1]
end

File.open("#{project_path}/project.pbxproj", "w") do |f|
  f << blocks[:start].join
  f << blocks[:references].join
  f << blocks[:end].join
end


####
# Initialize metadata symlinks
####
FileUtils.mkdir_p("fastlane/metadata/ios/#{$lang_meta_ios}")
def link_file_android(target, link)
  FileUtils.ln_sf("../../android/#{$lang_meta_android}/#{target}",
                  "fastlane/metadata/ios/#{$lang_meta_ios}/#{link}")
end
link_file_android "full_description.txt", "description.txt"
link_file_android "short_description.txt", "promotional_text.txt"
link_file_android "generic_release_notes.txt", "generic_release_notes.txt"
link_file_android "keywords.txt", "keywords.txt"
link_file_android "subtitle.txt", "subtitle.txt"
def link_file_en(target)
  FileUtils.ln_sf("../en-US/#{target}",
                  "fastlane/metadata/ios/#{$lang_meta_ios}/#{target}")
end
link_file_en "name.txt"
link_file_en "marketing_url.txt"
link_file_en "privacy_url.txt"
link_file_en "support_url.txt"

FileUtils.cp("../en-US/video.txt",
             "fastlane/metadata/android/#{$lang_meta_android}/video.txt")
