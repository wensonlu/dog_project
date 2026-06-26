Pod::Spec.new do |spec|
  spec.name = 'SocketRocket'
  spec.version = '0.7.1'
  spec.summary = 'A conforming WebSocket (RFC 6455) client library for iOS, macOS and tvOS.'
  spec.homepage = 'https://github.com/facebook/SocketRocket'
  spec.authors = {
    'Nikita Lutsenko' => 'nlutsenko@me.com',
    'Dan Federman' => 'dan@squareup.com',
    'Mike Lewis' => 'mikelikespie@gmail.com',
  }
  spec.license = 'BSD'
  spec.source = {
    :http => 'https://codeload.github.com/facebook/SocketRocket/tar.gz/refs/tags/0.7.1',
    :type => :tgz,
  }
  spec.requires_arc = true
  spec.source_files = 'SocketRocket/**/*.{h,m}'
  spec.public_header_files = 'SocketRocket/*.h'
  spec.platforms = {
    :ios => '11.0',
    :osx => '10.13',
    :tvos => '11.0',
    :visionos => '1.0',
  }
  spec.ios.frameworks = ['CFNetwork', 'Security']
  spec.osx.frameworks = ['CoreServices', 'Security']
  spec.tvos.frameworks = ['CFNetwork', 'Security']
  spec.libraries = 'icucore'
end
