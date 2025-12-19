require 'json'

module Jekyll
  class PackageVersionGenerator < Generator
    safe true
    priority :highest

    def generate(site)
      # Read package.json from parent directory
      package_json_path = File.join(site.source, '..', 'package.json')

      if File.exist?(package_json_path)
        package_data = JSON.parse(File.read(package_json_path))
        site.config['package_version'] = package_data['version']

        # Extract MSR Core version from dependencies
        if package_data['dependencies'] && package_data['dependencies']['@migration-script-runner/core']
          msr_core_version = package_data['dependencies']['@migration-script-runner/core']
          # Remove ^ or ~ prefix if present
          site.config['msr_core_version'] = msr_core_version.gsub(/^[\^~]/, '')
        else
          site.config['msr_core_version'] = 'unknown'
        end
      else
        site.config['package_version'] = 'unknown'
        site.config['msr_core_version'] = 'unknown'
      end
    end
  end
end
